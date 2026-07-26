import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import SafeImage from "./SafeImage.jsx";

function BookmarkIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill={filled ? "currentColor" : "none"}>
      <path d="M6.75 4.75A1.75 1.75 0 0 1 8.5 3h7a1.75 1.75 0 0 1 1.75 1.75V21L12 17.5 6.75 21V4.75Z" />
    </svg>
  );
}

export default function PlaceShowcase({
  places,
  user,
  savedPlaceNames,
  savingPlaceName,
  saveError,
  onSave,
}) {
  const showcaseRef = useRef(null);
  const playbackTimerRef = useRef(null);
  const [activePlace, setActivePlace] = useState(places[0]?.name ?? "");
  const [playingPlace, setPlayingPlace] = useState("");

  function playMoment(placeName) {
    window.clearTimeout(playbackTimerRef.current);
    setPlayingPlace("");
    window.requestAnimationFrame(() => {
      setPlayingPlace(placeName);
      playbackTimerRef.current = window.setTimeout(() => setPlayingPlace(""), 7000);
    });
  }

  useEffect(() => {
    const sections = showcaseRef.current?.querySelectorAll("[data-place-story]");
    if (!sections?.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

        if (visibleEntry) setActivePlace(visibleEntry.target.dataset.placeName);
      },
      { threshold: [0.35, 0.55, 0.75] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [places]);

  useEffect(() => () => window.clearTimeout(playbackTimerRef.current), []);

  return (
    <div className="place-showcase" ref={showcaseRef}>
      {places.map((place, index) => {
        const titleWords = place.name.split(" ");
        const firstWord = titleWords.shift();
        const remainingWords = titleWords.join(" ");
        const isSaved = savedPlaceNames.has(place.name);
        const isSaving = savingPlaceName === place.name;
        const isPlaying = playingPlace === place.name;

        return (
          <article
            className={`place-story ${activePlace === place.name ? "is-active" : ""} ${isPlaying ? "is-playing" : ""}`}
            data-place-story
            data-place-name={place.name}
            key={place.name}
          >
            <SafeImage
              className="place-story-backdrop"
              sources={place.images}
              alt=""
              fallbackLabel={place.name}
              loading="lazy"
              sizes="100vw"
              width="1440"
              height="900"
            />
            <button className="place-story-media" type="button" onClick={() => playMoment(place.name)} aria-label={`Play a seven second cinematic view of ${place.name}`}>
              <SafeImage
                className="place-story-image"
                sources={place.images}
                alt={`View of ${place.name}`}
                fallbackLabel={place.name}
                loading="lazy"
                sizes="(max-width: 680px) 88vw, 74vw"
                width="1200"
                height="760"
              />
              <span className="place-moment-play" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="m9 7 8 5-8 5V7Z" /></svg>
                {isPlaying ? "Playing moment" : "Play 7s moment"}
              </span>
              {isPlaying && <span className="place-moment-progress" aria-hidden="true"><i /></span>}
            </button>

            <div className="place-story-title" aria-hidden="true">
              <span>{firstWord}</span>
              {remainingWords && <span>{remainingWords}</span>}
            </div>

            <div className="place-story-content">
              <p className="place-story-count">Stop {String(index + 1).padStart(2, "0")}</p>
              <h3>{place.name}</h3>
              <p>{place.info}</p>
              <div className="place-story-actions">
                {place.location && (
                  <a className="place-map-button" href={place.location} target="_blank" rel="noreferrer">
                    View map <span aria-hidden="true">↗</span>
                  </a>
                )}
                {user ? (
                  <button
                    className={`place-save-button ${isSaved ? "is-saved" : ""}`}
                    type="button"
                    disabled={isSaved || isSaving}
                    onClick={() => onSave(place)}
                  >
                    <BookmarkIcon filled={isSaved} />
                    {isSaved ? "Saved to plan" : isSaving ? "Saving..." : "Save this place"}
                  </button>
                ) : (
                  <Link className="place-save-button" to="/login">
                    <BookmarkIcon /> Log in to save
                  </Link>
                )}
              </div>
              {saveError?.placeName === place.name && (
                <p className="place-save-error" role="alert">{saveError.message}</p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
