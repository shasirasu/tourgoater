import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import SafeImage from "./SafeImage.jsx";

const MAX_SCROLL = 1800;
const CARD_COUNT = 20;
const lerp = (start, end, progress) => start * (1 - progress) + end * progress;

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
  const scrollRef = useRef(0);
  const touchRef = useRef(0);
  const [phase, setPhase] = useState("scatter");
  const [size, setSize] = useState({ width: 1200, height: 760 });
  const [scrollValue, setScrollValue] = useState(0);
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const move = (delta) => {
      const next = Math.min(MAX_SCROLL, Math.max(0, scrollRef.current + delta));
      const consumed = next !== scrollRef.current;
      scrollRef.current = next;
      setScrollValue(next);
      return consumed;
    };
    const handleWheel = (event) => { if (move(event.deltaY)) event.preventDefault(); };
    const handleTouchStart = (event) => { touchRef.current = event.touches[0].clientY; };
    const handleTouchMove = (event) => {
      const currentY = event.touches[0].clientY;
      const consumed = move(touchRef.current - currentY);
      touchRef.current = currentY;
      if (consumed) event.preventDefault();
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => { container.removeEventListener("wheel", handleWheel); container.removeEventListener("touchstart", handleTouchStart); container.removeEventListener("touchmove", handleTouchMove); };
  }, []);

  const scatter = useMemo(() => items.map((_, index) => ({
    x: Math.sin(index * 7.13) * 850,
    y: Math.cos(index * 4.71) * 560,
    rotation: ((index * 47) % 180) - 90,
    scale: .6,
    opacity: 0,
  })), [items]);

  const morphProgress = Math.min(1, scrollValue / 520);
  const shuffleProgress = Math.max(0, (scrollValue - 520) / (MAX_SCROLL - 520));
  const isMobile = size.width < 700;
  const radius = Math.min(Math.min(size.width, size.height) * .34, 315);
  const arcRadius = Math.min(size.width, size.height * 1.5) * (isMobile ? 1.35 : 1.05);
  const spread = isMobile ? 100 : 130;

  return (
    <section ref={containerRef} className="scroll-morph-hero" onMouseMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setParallax((((event.clientX - rect.left) / rect.width) * 2 - 1) * 70); }} onMouseLeave={() => setParallax(0)}>
      <div className={`morph-intro-copy ${phase === "circle" && morphProgress < .45 ? "is-visible" : ""}`}><p>India is waiting.</p><h1>Choose a moment.<br />Build the journey.</h1><span>Scroll to explore</span></div>
      <div className={`morph-arc-copy ${morphProgress > .76 ? "is-visible" : ""}`}><p className="eyebrow">28 states · 190 places</p><h2>Find where your<br />budget can take you.</h2><span>Hover a card to discover the destination.</span></div>
      <div className="morph-card-stage" aria-hidden="true">
        {items.map((destination, index) => {
          let target = scatter[index];
          if (phase === "line") {
            const spacing = isMobile ? 42 : 66;
            target = { x: index * spacing - ((items.length - 1) * spacing) / 2, y: 0, rotation: 0, scale: isMobile ? .78 : 1, opacity: 1 };
          } else if (phase === "circle") {
            const circleAngle = (index / items.length) * 360;
            const circleRad = circleAngle * Math.PI / 180;
            const circle = { x: Math.cos(circleRad) * radius, y: Math.sin(circleRad) * radius, rotation: circleAngle + 90 };
            const startAngle = -90 - spread / 2;
            const arcAngle = startAngle + index * (spread / (items.length - 1)) - shuffleProgress * spread * .78;
            const arcRad = arcAngle * Math.PI / 180;
            const arc = { x: Math.cos(arcRad) * arcRadius + parallax, y: Math.sin(arcRad) * arcRadius + size.height * .27 + arcRadius, rotation: arcAngle + 90, scale: isMobile ? 1.18 : 1.65 };
            target = { x: lerp(circle.x, arc.x, morphProgress), y: lerp(circle.y, arc.y, morphProgress), rotation: lerp(circle.rotation, arc.rotation, morphProgress), scale: lerp(1, arc.scale, morphProgress), opacity: 1 };
          }
          return <FlipCard key={destination.id} destination={destination} index={index} target={target} />;
        })}
      </div>
      <div className="morph-scroll-meter"><span style={{ width: `${(scrollValue / MAX_SCROLL) * 100}%` }} /></div>
    </section>
  );
}
