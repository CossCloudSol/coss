'use client';

import { useEffect, useRef } from 'react';

// Mouse parallax for the hero laptop composition. Children carrying a
// `data-depth` attribute get translated on mousemove; everything else
// (rings, static decoration) is left alone. Desktop fine-pointer only,
// and skipped entirely under prefers-reduced-motion.
export default function HeroLaptopComposition({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reducedMotion) return;

    const elements = container.querySelectorAll<HTMLElement>('[data-depth]');
    let rect = container.getBoundingClientRect();

    const updateRect = () => { rect = container.getBoundingClientRect(); };

    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      elements.forEach((el) => {
        const depth = parseFloat(el.dataset.depth || '0');
        el.style.transform = `translate(${-nx * depth}px, ${-ny * depth}px)`;
      });
    };

    const handleMouseLeave = () => {
      elements.forEach((el) => { el.style.transform = 'translate(0, 0)'; });
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', updateRect);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', updateRect);
    };
  }, []);

  return (
    <div className="hero-laptop-wrap" ref={containerRef}>
      {children}
    </div>
  );
}
