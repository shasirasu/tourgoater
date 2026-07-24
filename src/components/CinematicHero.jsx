import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SafeImage from "./SafeImage.jsx";

const SLIDE_DURATION = 6500;

export default function CinematicHero({ destinations }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slides = destinations.slice(0, 4);
  const activeDestination = slides[activeIndex];

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setTimeout(() => setActiveIndex((current) => (current + 1) % slides.length), SLIDE_DURATION);
    return () => window.clearTimeout(timer);
  }, [activeIndex, paused, slides.length]);

  return (
    <section className={`cinematic-hero ${paused ? "is-paused" : ""}`} aria-labelledby="cinematic-title">
      <div className="cinematic-media" key={activeDestination.id}>
        <SafeImage className="cinematic-image" sources={activeDestination.img} alt={`Cinematic view of ${activeDestination.name}`} fallbackLabel={activeDestination.name} width="3840" height="2160" fetchPriority="high" />
      </div>
      <div className="cinematic-shade" />
      <div className="cinematic-grain" aria-hidden="true" />

      <div className="shell cinematic-content">
        <div className="cinematic-copy" key={`copy-${activeDestination.id}`}>
          <p className="cinematic-kicker"><span>Tourgoater presents</span><b>{String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</b></p>
          <h1 id="cinematic-title">Travel deeper.<br /><em>Spend smarter.</em></h1>
          <p className="cinematic-location">{activeDestination.name}</p>
          <p className="cinematic-description">Build a hotel-inclusive itinerary around the places you want to see—and the budget you want to keep.</p>
          <div className="cinematic-actions">
            <Link className="button" to="/browse">Build my trip</Link>
            <Link className="cinematic-link" to={`/destination/${activeDestination.id}`}>Explore this moment <span aria-hidden="true">↗</span></Link>
          </div>
        </div>

        <div className="cinematic-controls" aria-label="Featured destinations">
          <div className="cinematic-chapters">
            {slides.map((destination, index) => (
              <button className={index === activeIndex ? "is-active" : ""} type="button" key={destination.id} onClick={() => setActiveIndex(index)} aria-label={`Show ${destination.name}`} aria-current={index === activeIndex ? "true" : undefined}>
                <span className="chapter-progress" /><b>{String(index + 1).padStart(2, "0")}</b><span>{destination.name}</span>
              </button>
            ))}
          </div>
          <button className="cinematic-pause" type="button" onClick={() => setPaused((current) => !current)} aria-label={paused ? "Play cinematic scenes" : "Pause cinematic scenes"}>
            <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
          </button>
        </div>
      </div>
      <div className="cinematic-scroll" aria-hidden="true"><span /> Scroll to discover</div>
    </section>
  );
}
