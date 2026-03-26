import { useEffect, useRef, useState } from "react";

interface Props {
  to: number;
  className?: string;
  suffix?: string;
  duration?: number;
}

export default function CountUp({
  to,
  className,
  suffix,
  duration = 1.6,
}: Props) {
  const [value, setValue] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const node = elementRef.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setValue(to);
      return;
    }

    let rafId = 0;
    let animationStartedAt = 0;

    const startAnimation = () => {
      if (hasAnimatedRef.current) return;
      hasAnimatedRef.current = true;

      const animate = (timestamp: number) => {
        if (!animationStartedAt) animationStartedAt = timestamp;
        const elapsed = timestamp - animationStartedAt;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * to));

        if (progress < 1) {
          rafId = window.requestAnimationFrame(animate);
        }
      };

      rafId = window.requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        startAnimation();
        observer.disconnect();
      },
      {
        threshold: 0.2,
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [duration, to]);

  const formatted = value.toLocaleString("pt-BR");

  return (
    <span ref={elementRef} className={className}>
      <span>{formatted}</span>
      {suffix && (
        <span className="align-top text-2xl font-bold">{suffix}</span>
      )}
    </span>
  );
}
