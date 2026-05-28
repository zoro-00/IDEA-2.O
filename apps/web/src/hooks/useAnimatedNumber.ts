// ============================================================
// STAR — useAnimatedNumber Hook
// Eases a number from 0 to target over a specified duration
// ============================================================
import { useState, useEffect } from "react";

export function useAnimatedNumber(
  targetValue: number,
  durationMs: number = 2000,
  startDelayMs: number = 0,
  inView: boolean = true
) {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let startTime: number | null = null;
    let animationFrame: number;
    let delayTimeout: NodeJS.Timeout;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      
      // easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);
      
      setCurrentValue(targetValue * ease);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetValue);
      }
    };

    delayTimeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, startDelayMs);

    return () => {
      clearTimeout(delayTimeout);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [targetValue, durationMs, startDelayMs, inView]);

  return currentValue;
}
