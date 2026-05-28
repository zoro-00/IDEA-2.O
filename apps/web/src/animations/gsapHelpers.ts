// ============================================================
// STAR — GSAP Helpers
// GSAP utility functions for complex sequence animations
// ============================================================
import gsap from "gsap";

export function initParallax(elements: string | HTMLElement | NodeListOf<HTMLElement>, speed: number = 0.5) {
  return gsap.to(elements, {
    y: () => -100 * speed,
    ease: "none",
    scrollTrigger: {
      trigger: elements,
      start: "top bottom",
      end: "bottom top",
      scrub: 0.5,
    },
  });
}

export function animateCounter(targetRef: HTMLElement, targetValue: number, duration: number = 2) {
  const obj = { val: 0 };
  return gsap.to(obj, {
    val: targetValue,
    duration,
    ease: "power3.out",
    onUpdate: () => {
      targetRef.innerText = Math.floor(obj.val).toLocaleString();
    },
  });
}

export function pulseNode(nodeRef: HTMLElement, color: string) {
  return gsap.to(nodeRef, {
    boxShadow: `0 0 20px ${color}, 0 0 40px ${color}`,
    scale: 1.1,
    duration: 0.5,
    yoyo: true,
    repeat: 1,
    ease: "power2.inOut",
  });
}
