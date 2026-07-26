import { Children, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function FlowSection({ className = "", children, ariaLabel }) {
  return (
    <section data-flow-section aria-label={ariaLabel} className={`flow-section ${className}`}>
      <div data-flow-inner className="flow-section-inner">{children}</div>
    </section>
  );
}

export default function FlowArt({ children, className = "", ariaLabel = "Destination planning journey" }) {
  const containerRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useGSAP(() => {
    if (!containerRef.current || reducedMotion) return undefined;
    const sections = Array.from(containerRef.current.querySelectorAll("[data-flow-section]"));
    const triggers = [];

    sections.forEach((section, index) => {
      gsap.set(section, { zIndex: index + 1 });
      const inner = section.querySelector("[data-flow-inner]");
      if (!inner) return;

      if (index > 0) {
        gsap.set(inner, { rotation: 20, transformOrigin: "bottom left" });
        const tween = gsap.to(inner, {
          rotation: 0,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top bottom", end: "top 25%", scrub: true },
        });
        if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
      }

      if (index < sections.length - 1) {
        triggers.push(ScrollTrigger.create({
          trigger: section,
          start: "bottom bottom",
          end: "bottom top",
          pin: true,
          pinSpacing: false,
        }));
      }
    });

    ScrollTrigger.refresh();
    return () => triggers.forEach((trigger) => trigger.kill());
  }, { scope: containerRef, dependencies: [Children.count(children), reducedMotion], revertOnUpdate: true });

  return <div ref={containerRef} aria-label={ariaLabel} className={`flow-art ${className}`}>{children}</div>;
}
