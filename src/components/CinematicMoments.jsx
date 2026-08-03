import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import travelData from "../data/travelData.js";

const MOMENTS = [
  { destinationId: "4", video: "/videos/moments/kerala.mp4", eyebrow: "Drift into calm", title: "Wake up beside the backwaters.", caption: "Kerala · slow mornings, palms and open water" },
  { destinationId: "3", video: "/videos/moments/rajasthan.mp4", eyebrow: "Walk through history", title: "Watch the desert turn gold.", caption: "Rajasthan · forts, colour and evening light" },
  { destinationId: "2", video: "/videos/moments/punjab.mp4", eyebrow: "Feel the warmth", title: "Step into Punjab's living spirit.", caption: "Punjab · golden fields, devotion and generous welcomes" },
  { destinationId: "1", video: "/videos/moments/andaman-nicobar.mp4", eyebrow: "Follow the horizon", title: "Let the islands feel far away.", caption: "Andaman & Nicobar · clear water and quiet shores" },
];

const MOMENT_DURATION = 10000;

export default function CinematicMoments() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRefs = useRef([]);
  const scenes = useMemo(() => MOMENTS.map((moment) => ({ ...moment, destination: travelData.state.find((state) => state.id === moment.destinationId) })).filter((moment) => moment.destination), []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index !== activeIndex || !isPlaying || prefersReducedMotion) {
        video.pause();
        return;
      }
      video.currentTime = 0;
      video.play().catch(() => setIsPlaying(false));
    });
    if (!isPlaying || prefersReducedMotion) return undefined;
    const timer = window.setTimeout(() => setActiveIndex((current) => (current + 1) % scenes.length), MOMENT_DURATION);
    return () => window.clearTimeout(timer);
  }, [activeIndex, isPlaying, scenes.length]);

  const activeScene = scenes[activeIndex];
  if (!activeScene) return null;

  return (
    <section className="moments-section" aria-label="Cinematic travel moments">
      <div className="moments-player">
        <div className="moments-scenes" aria-live="polite">
          {scenes.map((scene, index) => (
            <div className={`moments-scene ${index === activeIndex ? "is-active" : ""}`} aria-hidden={index !== activeIndex} key={scene.destinationId}>
              <video
                className="moments-media moments-media-video"
                ref={(element) => { videoRefs.current[index] = element; }}
                muted
                playsInline
                preload={index === 0 ? "auto" : "metadata"}
                poster={scene.destination.img?.[1] || scene.destination.img?.[0]}
                aria-label={`Cinematic view of ${scene.destination.name}`}
                onEnded={() => isPlaying && setActiveIndex((current) => (current + 1) % scenes.length)}
              >
                <source src={scene.video} type="video/mp4" />
              </video>
            </div>
          ))}
        </div>
        <div className="moments-shade" />
        <div className="moments-content shell">
          <p className="moments-eyebrow">{activeScene.eyebrow}</p><h3>{activeScene.title}</h3><p>{activeScene.caption}</p>
          <div className="moments-actions">
            <Link className="moments-primary-link" to="/browse">Build my trip <span aria-hidden="true">→</span></Link>
            <Link className="moments-link" to={`/destination/${activeScene.destinationId}`}>Experience {activeScene.destination.name} <span aria-hidden="true">→</span></Link>
          </div>
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
