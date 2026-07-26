import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import SafeImage from "./SafeImage.jsx";

const CARD_COUNT = 20;

function FlipCard({ destination, index, target }) {
  return (
    <motion.div className="morph-card" animate={{ x: target.x, y: target.y, rotate: target.rotation, scale: target.scale, opacity: target.opacity }} transition={{ type: "spring", stiffness: 42, damping: 16 }}>
      <motion.div className="morph-card-inner" whileHover={{ rotateY: 180 }} transition={{ duration: .55, type: "spring", stiffness: 240, damping: 20 }}>
        <div className="morph-card-face morph-card-front"><SafeImage sources={destination.img} alt={destination.name} fallbackLabel={destination.name} width="180" height="250" /></div>
        <div className="morph-card-face morph-card-back"><span>Explore</span><strong>{destination.name}</strong></div>
      </motion.div>
    </motion.div>
  );
}

export default function ScrollMorphHero({ destinations }) {
  const items = destinations.slice(0, CARD_COUNT);
  const containerRef = useRef(null);
  const [phase, setPhase] = useState("scatter");
  const [size, setSize] = useState({ width: 1200, height: 760 });
  const [parallax, setParallax] = useState(0);

  useEffect(() => {
    const lineTimer = window.setTimeout(() => setPhase("line"), 450);
    const circleTimer = window.setTimeout(() => setPhase("circle"), 2200);
    return () => { window.clearTimeout(lineTimer); window.clearTimeout(circleTimer); };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const scatter = useMemo(() => items.map((_, index) => ({
    x: Math.sin(index * 7.13) * 850,
    y: Math.cos(index * 4.71) * 560,
    rotation: ((index * 47) % 180) - 90,
    scale: .6,
    opacity: 0,
  })), [items]);

  const isMobile = size.width < 700;
  const radius = Math.min(Math.min(size.width, size.height) * .34, 315);

  return (
    <section ref={containerRef} className="scroll-morph-hero" onMouseMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setParallax((((event.clientX - rect.left) / rect.width) * 2 - 1) * 70); }} onMouseLeave={() => setParallax(0)}>
      <div className={`morph-intro-copy ${phase === "circle" ? "is-visible" : ""}`}><p>India is waiting.</p><h1>Choose a moment.<br />Build the journey.</h1><span>Hover a card, then scroll normally to plan</span></div>
      <div className="morph-card-stage" aria-hidden="true">
        {items.map((destination, index) => {
          let target = scatter[index];
          if (phase === "line") {
            const spacing = isMobile ? 42 : 66;
            target = { x: index * spacing - ((items.length - 1) * spacing) / 2, y: 0, rotation: 0, scale: isMobile ? .78 : 1, opacity: 1 };
          } else if (phase === "circle") {
            const circleAngle = (index / items.length) * 360;
            const circleRad = circleAngle * Math.PI / 180;
            target = { x: Math.cos(circleRad) * radius + parallax, y: Math.sin(circleRad) * radius, rotation: circleAngle + 90, scale: isMobile ? .82 : 1, opacity: 1 };
          }
          return <FlipCard key={destination.id} destination={destination} index={index} target={target} />;
        })}
      </div>
    </section>
  );
}
