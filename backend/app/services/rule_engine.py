# ============================================================
# STAR — Rule Engine
# Deterministic AML pattern detection (no ML)
# ============================================================
from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.models.internal import RuleHit
from app.models.requests import RawTransactionRequest

logger = logging.getLogger(__name__)

# ── Rule Thresholds ───────────────────────────────────────────
STRUCTURING_LOWER = 8_000.0
STRUCTURING_UPPER = 10_000.0
STRUCTURING_WINDOW_H = 24
STRUCTURING_MIN_COUNT = 3

FAN_OUT_THRESHOLD = 8        # unique receivers in 1h
FAN_OUT_WINDOW_H = 1

RAPID_MOVEMENT_MIN_HOPS = 4
RAPID_MOVEMENT_WINDOW_MIN = 30

DORMANCY_THRESHOLD_DAYS = 90
REACTIVATION_AMOUNT_THRESHOLD = 10_000.0

ROUND_TRIP_WINDOW_H = 24
ROUND_TRIP_MIN_HOPS = 2

VELOCITY_MULTIPLIER = 3.0    # 3× baseline triggers alert
VELOCITY_WINDOW_H = 1

HIGH_VALUE_THRESHOLD = 100_000.0


# Severity score contributions (added to rule_score)
SEVERITY_SCORES = {"low": 5, "medium": 15, "high": 25, "critical": 40}


class RuleEngine:
    """
    Applies deterministic AML rules to a transaction set.
    Each rule returns a RuleHit if triggered.
    """

    def analyze(
        self,
        account_id: str,
        transactions: List[RawTransactionRequest],
        prior_txn_count: int = 0,
    ) -> List[RuleHit]:
        """
        Run all rules on the transaction set for the given account.
        prior_txn_count: historical baseline for velocity rule.
        """
        hits: List[RuleHit] = []

        hits.extend(self._structuring_check(account_id, transactions))
        hits.extend(self._fan_out_check(account_id, transactions))
        hits.extend(self._rapid_movement_check(transactions))
        hits.extend(self._dormant_reactivation_check(account_id, transactions))
        hits.extend(self._round_trip_check(transactions, account_id))
        hits.extend(self._velocity_check(account_id, transactions, prior_txn_count))
        hits.extend(self._high_value_check(transactions))

        return hits

    # ── Rule Implementations ───────────────────────────────────

    def _structuring_check(
        self, account_id: str, transactions: List[RawTransactionRequest]
    ) -> List[RuleHit]:
        """Multiple transactions just under reporting threshold."""
        sent = [
            t for t in transactions
            if t.from_account == account_id
            and STRUCTURING_LOWER < t.amount < STRUCTURING_UPPER
        ]
        if len(sent) < STRUCTURING_MIN_COUNT:
            return []

        # Group by 24h windows
        windows: Dict[int, List[RawTransactionRequest]] = defaultdict(list)
        for t in sent:
            if t.timestamp:
                day_bucket = int(t.timestamp // 86400)
                windows[day_bucket].append(t)

        hits = []
        for day, txns in windows.items():
            if len(txns) >= STRUCTURING_MIN_COUNT:
                total = sum(t.amount for t in txns)
                hits.append(RuleHit(
                    rule="structuring",
                    severity="high",
                    description=(
                        f"{len(txns)} transactions between ${STRUCTURING_LOWER:,.0f}–"
                        f"${STRUCTURING_UPPER:,.0f} within 24h (total: ${total:,.0f})"
                    ),
                    score_contribution=SEVERITY_SCORES["high"],
                    evidence={
                        "txn_count": len(txns),
                        "total_amount": total,
                        "amounts": [t.amount for t in txns],
                        "window_day": day,
                    },
                ))
        return hits

    def _fan_out_check(
        self, account_id: str, transactions: List[RawTransactionRequest]
    ) -> List[RuleHit]:
        """One account sending to many distinct receivers rapidly."""
        sent = [t for t in transactions if t.from_account == account_id and t.timestamp]
        if not sent:
            return []

        # Sort by timestamp, slide 1h window
        sent.sort(key=lambda t: t.timestamp)
        hits = []
        for i, t in enumerate(sent):
            window_end = t.timestamp + FAN_OUT_WINDOW_H * 3600
            window_txns = [s for s in sent if t.timestamp <= s.timestamp <= window_end]
            receivers = {s.to_account for s in window_txns}
            if len(receivers) >= FAN_OUT_THRESHOLD:
                hits.append(RuleHit(
                    rule="fan_out",
                    severity="high",
                    description=(
                        f"Account sent to {len(receivers)} unique receivers "
                        f"within {FAN_OUT_WINDOW_H}h"
                    ),
                    score_contribution=SEVERITY_SCORES["high"],
                    evidence={
                        "unique_receivers": len(receivers),
                        "txn_count": len(window_txns),
                        "total_amount": sum(s.amount for s in window_txns),
                    },
                ))
                break  # one hit per account is enough
        return hits

    def _rapid_movement_check(
        self, transactions: List[RawTransactionRequest]
    ) -> List[RuleHit]:
        """Money moving through 4+ hops in 30 minutes."""
        if len(transactions) < RAPID_MOVEMENT_MIN_HOPS:
            return []

        # Build time-sorted chain
        sorted_txns = sorted([t for t in transactions if t.timestamp], key=lambda t: t.timestamp)
        hits = []

        for i in range(len(sorted_txns) - RAPID_MOVEMENT_MIN_HOPS + 1):
            window = sorted_txns[i: i + RAPID_MOVEMENT_MIN_HOPS]
            time_span = window[-1].timestamp - window[0].timestamp
            if time_span <= RAPID_MOVEMENT_WINDOW_MIN * 60:
                # Check if they form a chain: A→B→C→D
                is_chain = all(
                    window[j].to_account == window[j + 1].from_account
                    for j in range(len(window) - 1)
                )
                if is_chain:
                    hits.append(RuleHit(
                        rule="rapid_layering",
                        severity="critical",
                        description=(
                            f"Funds moved through {RAPID_MOVEMENT_MIN_HOPS} hops "
                            f"in {time_span/60:.1f} minutes"
                        ),
                        score_contribution=SEVERITY_SCORES["critical"],
                        evidence={
                            "hops": RAPID_MOVEMENT_MIN_HOPS,
                            "time_span_minutes": round(time_span / 60, 2),
                            "path": [t.from_account for t in window] + [window[-1].to_account],
                            "amounts": [t.amount for t in window],
                        },
                    ))
                    break
        return hits

    def _dormant_reactivation_check(
        self, account_id: str, transactions: List[RawTransactionRequest]
    ) -> List[RuleHit]:
        """Account silent for 90+ days suddenly sends high-value transaction."""
        all_txns = sorted([t for t in transactions if t.timestamp], key=lambda t: t.timestamp)
        if len(all_txns) < 2:
            return []

        # Find the largest gap
        for i in range(1, len(all_txns)):
            gap_days = (all_txns[i].timestamp - all_txns[i - 1].timestamp) / 86400
            if gap_days >= DORMANCY_THRESHOLD_DAYS:
                # Check if reactivation txn is high-value
                reactivation_txn = all_txns[i]
                if (reactivation_txn.from_account == account_id
                        and reactivation_txn.amount >= REACTIVATION_AMOUNT_THRESHOLD):
                    return [RuleHit(
                        rule="dormant_reactivation",
                        severity="high",
                        description=(
                            f"Account dormant for {gap_days:.0f} days then sent "
                            f"${reactivation_txn.amount:,.0f}"
                        ),
                        score_contribution=SEVERITY_SCORES["high"],
                        evidence={
                            "dormancy_days": round(gap_days, 1),
                            "reactivation_amount": reactivation_txn.amount,
                            "tx_id": reactivation_txn.id,
                        },
                    )]
        return []

    def _round_trip_check(
        self, transactions: List[RawTransactionRequest], origin: str
    ) -> List[RuleHit]:
        """Money leaving origin returns within 24h via ≥2 hops."""
        # Build adjacency
        graph: Dict[str, List[RawTransactionRequest]] = defaultdict(list)
        for t in transactions:
            if t.timestamp:
                graph[t.from_account].append(t)

        origin_txns = graph.get(origin, [])
        if not origin_txns:
            return []

        def find_return(node: str, start_ts: float, amount: float, depth: int) -> bool:
            if depth > 8:
                return False
            for t in graph.get(node, []):
                if t.timestamp and t.timestamp - start_ts <= ROUND_TRIP_WINDOW_H * 3600:
                    if t.to_account == origin and depth >= ROUND_TRIP_MIN_HOPS:
                        return True
                    if find_return(t.to_account, start_ts, amount, depth + 1):
                        return True
            return False

        hits = []
        for txn in origin_txns:
            if find_return(txn.to_account, txn.timestamp, txn.amount, 1):
                hits.append(RuleHit(
                    rule="round_tripping",
                    severity="critical",
                    description=(
                        f"Funds of ${txn.amount:,.0f} returned to origin "
                        f"within {ROUND_TRIP_WINDOW_H}h"
                    ),
                    score_contribution=SEVERITY_SCORES["critical"],
                    evidence={"amount": txn.amount, "tx_id": txn.id},
                ))
                break  # one hit enough
        return hits

    def _velocity_check(
        self,
        account_id: str,
        transactions: List[RawTransactionRequest],
        prior_count: int,
    ) -> List[RuleHit]:
        """Transaction rate exceeds 3× historical baseline in 1h window."""
        recent = [
            t for t in transactions
            if t.from_account == account_id and t.timestamp
        ]
        if not recent or prior_count == 0:
            return []

        recent.sort(key=lambda t: t.timestamp)
        latest = recent[-1].timestamp
        last_hour = [t for t in recent if latest - t.timestamp <= 3600]
        baseline_per_hour = prior_count / max(len(recent) or 1, 1)

        if len(last_hour) >= VELOCITY_MULTIPLIER * max(baseline_per_hour, 1):
            return [RuleHit(
                rule="high_velocity",
                severity="medium",
                description=(
                    f"{len(last_hour)} transactions in 1h "
                    f"({VELOCITY_MULTIPLIER}× above baseline)"
                ),
                score_contribution=SEVERITY_SCORES["medium"],
                evidence={
                    "count_last_hour": len(last_hour),
                    "baseline_per_hour": round(baseline_per_hour, 2),
                },
            )]
        return []

    def _high_value_check(
        self, transactions: List[RawTransactionRequest]
    ) -> List[RuleHit]:
        """Single transaction above $100k threshold."""
        hits = []
        for t in transactions:
            if t.amount >= HIGH_VALUE_THRESHOLD:
                hits.append(RuleHit(
                    rule="high_value_transaction",
                    severity="medium",
                    description=f"Transaction of ${t.amount:,.0f} exceeds $100k threshold",
                    score_contribution=SEVERITY_SCORES["medium"],
                    evidence={"amount": t.amount, "tx_id": t.id},
                ))
        return hits[:3]  # cap at 3 to avoid noise

    @staticmethod
    def compute_rule_score(hits: List[RuleHit]) -> float:
        """Aggregate rule hits into a 0-100 score."""
        if not hits:
            return 0.0
        total = sum(hit.score_contribution for hit in hits)
        return min(100.0, total)


# ── Singleton ─────────────────────────────────────────────────
rule_engine = RuleEngine()
