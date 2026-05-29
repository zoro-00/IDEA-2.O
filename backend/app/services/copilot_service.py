# ============================================================
# STAR — AI Copilot Service
# LangChain + Gemini for AML investigation assistance
# ============================================================
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

# Conversation memory per session
_SESSION_MEMORY: Dict[str, List[Dict]] = {}
MAX_HISTORY = 10  # keep last 10 turns


AML_SYSTEM_PROMPT = """You are STAR Copilot — an expert AI assistant for Anti-Money Laundering (AML) investigations.

You have access to:
- A real-time transaction graph (Neo4j + NetworkX)
- Isolation Forest anomaly scores for accounts
- TGNN (Graph Attention Network) fraud probability scores
- Pattern detection rules (structuring, fan-out, rapid layering, round-tripping)

Your persona:
- You are an experienced AML investigator with 15 years of experience
- You speak in clear, precise language suitable for compliance teams
- You always cite specific scores, thresholds, and evidence when explaining risk
- You can suggest investigation steps, graph traversals, and SAR narratives
- You flag false positives where applicable

When answering questions:
1. Reference specific risk scores and model outputs
2. Explain the AML typology being detected
3. Suggest next investigation steps
4. Note regulatory reporting requirements (CTR, SAR) where appropriate

Available context will be injected as JSON before each query.
"""


class CopilotService:
    """
    LangChain-powered AML investigation assistant using Google Gemini.

    Features:
    - Multi-turn conversation with session memory
    - Streaming responses
    - SAR draft generation
    - AML-specific tools (graph queries, scoring)
    """

    def __init__(self) -> None:
        self._llm = None
        self._loaded = False

    def load(self) -> None:
        """Initialize Gemini LLM via LangChain."""
        if not settings.GEMINI_API_KEY:
            logger.warning(
                "GEMINI_API_KEY not set — copilot will use fallback responses"
            )
            self._loaded = False
            return

        try:
            from langchain_google_genai import ChatGoogleGenerativeAI  # type: ignore

            self._llm = ChatGoogleGenerativeAI(
                model=settings.GEMINI_MODEL,
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.3,
                max_tokens=2048,
                streaming=True,
            )
            self._loaded = True
            logger.info("✅ Copilot (Gemini %s) loaded", settings.GEMINI_MODEL)
        except ImportError:
            logger.error(
                "langchain-google-genai not installed. "
                "Run: uv add langchain-google-genai"
            )
        except Exception as e:
            logger.error("Failed to initialize Gemini: %s", e)

    async def query(
        self,
        message: str,
        session_id: str = "default",
        context: Optional[Dict] = None,
    ) -> str:
        """Non-streaming query — returns complete response."""
        if not self._loaded:
            return self._fallback_response(message)

        history = _SESSION_MEMORY.get(session_id, [])
        prompt = self._build_prompt(message, history, context)

        try:
            from langchain_core.messages import HumanMessage, SystemMessage  # type: ignore

            messages = [SystemMessage(content=AML_SYSTEM_PROMPT)]
            for turn in history[-MAX_HISTORY:]:
                messages.append(HumanMessage(content=turn["user"]))
                if turn.get("assistant"):
                    from langchain_core.messages import AIMessage  # type: ignore
                    messages.append(AIMessage(content=turn["assistant"]))
            messages.append(HumanMessage(content=prompt))

            response = await self._llm.ainvoke(messages)
            content = response.content

            # Update history
            history.append({"user": message, "assistant": content})
            _SESSION_MEMORY[session_id] = history[-MAX_HISTORY:]

            return content
        except Exception as e:
            logger.error("Copilot query failed: %s", e)
            return f"Investigation analysis unavailable: {e}"

    async def stream_query(
        self,
        message: str,
        session_id: str = "default",
        context: Optional[Dict] = None,
    ) -> AsyncGenerator[str, None]:
        """Streaming query — yields chunks as they arrive."""
        if not self._loaded:
            yield self._fallback_response(message)
            return

        history = _SESSION_MEMORY.get(session_id, [])
        prompt = self._build_prompt(message, history, context)

        try:
            from langchain_core.messages import HumanMessage, SystemMessage  # type: ignore

            messages = [SystemMessage(content=AML_SYSTEM_PROMPT)]
            for turn in history[-MAX_HISTORY:]:
                messages.append(HumanMessage(content=turn["user"]))
                if turn.get("assistant"):
                    from langchain_core.messages import AIMessage  # type: ignore
                    messages.append(AIMessage(content=turn["assistant"]))
            messages.append(HumanMessage(content=prompt))

            full_response = []
            async for chunk in self._llm.astream(messages):
                token = chunk.content
                if token:
                    full_response.append(token)
                    yield token

            # Save to memory
            full_text = "".join(full_response)
            history.append({"user": message, "assistant": full_text})
            _SESSION_MEMORY[session_id] = history[-MAX_HISTORY:]

        except Exception as e:
            logger.error("Streaming copilot failed: %s", e)
            yield f"Error: {e}"

    async def generate_sar(
        self,
        account_id: str,
        alert_ids: List[str],
        investigation_notes: Optional[str] = None,
        risk_summary: Optional[Dict] = None,
    ) -> Dict:
        """Generate a Suspicious Activity Report narrative using Gemini."""
        sar_prompt = f"""Generate a formal Suspicious Activity Report (SAR) narrative for the following case.

Account ID: {account_id}
Alert IDs: {', '.join(alert_ids)}
Investigation Notes: {investigation_notes or 'None provided'}
Risk Summary: {risk_summary or {}}

The SAR narrative must:
1. Describe the suspicious activity pattern in detail
2. Identify the AML typology (structuring, layering, integration, etc.)
3. State the time period and total amounts involved
4. Reference the specific transactions or patterns flagged
5. Recommend regulatory action (STR/SAR filing, account freeze, etc.)
6. Be 3-5 paragraphs, formal compliance language
7. Include the AI model scores as supporting evidence

Return ONLY the narrative text, no headers or JSON."""

        if self._loaded:
            try:
                from langchain_core.messages import HumanMessage, SystemMessage  # type: ignore

                messages = [
                    SystemMessage(content="You are a senior AML compliance officer writing SAR reports."),
                    HumanMessage(content=sar_prompt),
                ]
                response = await self._llm.ainvoke(messages)
                narrative = response.content
            except Exception as e:
                narrative = f"SAR generation failed: {e}. Manual review required."
        else:
            narrative = (
                f"[AUTOMATED SAR DRAFT - GEMINI UNAVAILABLE]\n\n"
                f"This SAR pertains to account {account_id} flagged under alerts "
                f"{', '.join(alert_ids)}. {investigation_notes or ''} "
                f"Manual narrative completion required."
            )

        now = datetime.now(timezone.utc)
        return {
            "id": f"SAR-{str(uuid.uuid4())[:8].upper()}",
            "subject": f"Suspicious Activity Report — {account_id}",
            "account_id": account_id,
            "narrative": narrative,
            "risk_score": risk_summary.get("final_score", 0.0) if risk_summary else 0.0,
            "gnn_score": risk_summary.get("tgnn_score", 0.0) if risk_summary else 0.0,
            "entity_count": len(alert_ids),
            "total_amount": risk_summary.get("total_amount", 0.0) if risk_summary else 0.0,
            "date_range": now.strftime("%Y-%m-%d"),
            "pattern": "Automated detection — multi-pattern",
            "status": "draft",
            "created_at": now.isoformat(),
        }

    def _build_prompt(
        self, message: str, history: List[Dict], context: Optional[Dict]
    ) -> str:
        if not context:
            return message

        ctx_str = "\n".join(f"{k}: {v}" for k, v in context.items())
        return f"""[INVESTIGATION CONTEXT]
{ctx_str}

[ANALYST QUERY]
{message}"""

    @staticmethod
    def _fallback_response(message: str) -> str:
        """Rule-based responses when Gemini is unavailable."""
        msg_lower = message.lower()
        if any(w in msg_lower for w in ["sar", "report", "file"]):
            return (
                "To generate a SAR, ensure GEMINI_API_KEY is set in backend/.env. "
                "The SAR endpoint (/copilot/sar) will automatically draft a narrative "
                "from the account's risk signals and transaction history."
            )
        if any(w in msg_lower for w in ["risk", "score", "suspicious"]):
            return (
                "Use /score/account to get the full Isolation Forest + TGNN + rule "
                "fusion score for any account. Scores above 65/100 generate automatic alerts."
            )
        if any(w in msg_lower for w in ["graph", "path", "trace"]):
            return (
                "Use /graph/subgraph?account_id=ACCT-123&depth=2 to visualize the "
                "transaction network. /graph/path?from=A&to=B traces money movement."
            )
        return (
            "STAR Copilot requires GEMINI_API_KEY to be set in backend/.env. "
            "Please add your Google AI API key to enable AI-powered investigation assistance."
        )

    @property
    def is_loaded(self) -> bool:
        return self._loaded


# ── Singleton ─────────────────────────────────────────────────
copilot_service = CopilotService()
