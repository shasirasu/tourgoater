import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import travelData from "../data/travelData.js";
import SafeImage from "./SafeImage.jsx";

const MOMENTS = [
  { destinationId: "4", eyebrow: "Drift into calm", title: "Wake up beside the backwaters.", caption: "Kerala · slow mornings, palms and open water" },
  { destinationId: "3", eyebrow: "Walk through history", title: "Watch the desert turn gold.", caption: "Rajasthan · forts, colour and evening light" },
  { destinationId: "7", eyebrow: "Breathe a little deeper", title: "Find your pace in the mountains.", caption: "Himachal Pradesh · valleys, trails and cool air" },
  { destinationId: "1", eyebrow: "Follow the horizon", title: "Let the islands feel far away.", caption: "Andaman & Nicobar · clear water and quiet shores" },
];

const MOMENT_DURATION = 6500;

export default function CinematicMoments() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const scenes = useMemo(() => MOMENTS.map((moment) => ({ ...moment, destination: travelData.state.find((state) => state.id === moment.destinationId) })).filter((moment) => moment.destination), []);

  useEffect(() => {
    if (!isPlaying || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setTimeout(() => setActiveIndex((current) => (current + 1) % scenes.length), MOMENT_DURATION);
    return () => window.clearTimeout(timer);
  }, [activeIndex, isPlaying, scenes.length]);

  const activeScene = scenes[activeIndex];
  if (!activeScene) return null;

  return (
    <section className="moments-section" aria-labelledby="moments-title">
      <div className="moments-intro shell">
        <div><p className="eyebrow">See yourself there</p><h2 id="moments-title">Travel should feel like a moment.</h2></div>
        <p>A cinematic preview of the places your budget can take you.</p>
      </div>
      <div className="moments-player">
        <div className="moments-scenes" aria-live="polite">
          {scenes.map((scene, index) => (
            <div className={`moments-scene ${index === activeIndex ? "is-active" : ""}`} aria-hidden={index !== activeIndex} key={scene.destinationId}>
              <SafeImage className="moments-media" sources={[scene.destination.img?.[1], ...scene.destination.img]} alt={index === activeIndex ? `Cinematic view of ${scene.destination.name}` : ""} fallbackLabel={scene.destination.name} loading={index === 0 ? "eager" : "lazy"} width="3840" height="2160" />
            </div>
          ))}
        </div>
        <div className="moments-shade" />
        <div className="moments-content shell">
          <p className="moments-eyebrow">{activeScene.eyebrow}</p><h3>{activeScene.title}</h3><p>{activeScene.caption}</p>
          <Link className="moments-link" to={`/destination/${activeScene.destinationId}`}>Experience {activeScene.destination.name} <span aria-hidden="true">→</span></Link>
        </div>
        <div className="moments-controls shell">
          <button className="moments-play" type="button" onClick={() => setIsPlaying((playing) => !playing)} aria-label={isPlaying ? "Pause cinematic moments" : "Play cinematic moments"}><span aria-hidden="true">{isPlaying ? "Ⅱ" : "▶"}</span></button>
          <div className="moments-timeline" role="tablist" aria-label="Travel moments">
            {scenes.map((scene, index) => (
              <button className={index === activeIndex ? "is-active" : ""} type="button" role="tab" aria-selected={index === activeIndex} aria-label={`Show ${scene.destination.name}`} key={scene.destinationId} onClick={() => setActiveIndex(index)}>
                <span className="moments-progress" style={{ "--moment-duration": `${MOMENT_DURATION}ms`, animationPlayState: isPlaying ? "running" : "paused" }} /><b>{String(index + 1).padStart(2, "0")}</b><span>{scene.destination.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
