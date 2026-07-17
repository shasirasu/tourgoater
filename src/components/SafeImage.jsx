import { useEffect, useMemo, useState } from "react";

export default function SafeImage({ sources, alt, fallbackLabel, ...imageProps }) {
  const availableSources = useMemo(
    () => (Array.isArray(sources) ? sources.filter(Boolean) : [sources].filter(Boolean)),
    [sources],
  );
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [availableSources]);

  if (!availableSources[sourceIndex]) {
    return (
      <div
        className={`image-fallback ${imageProps.className || ""}`}
        role="img"
        aria-label={`${alt}. Image unavailable.`}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 19h16V5H4v14Z" />
          <path d="m4 16 4.5-4.5 3 3 2-2L20 18" />
          <path d="M15.5 9.5h.01" />
        </svg>
        <span>{fallbackLabel || "Destination image unavailable"}</span>
      </div>
    );
  }

  return (
    <img
      {...imageProps}
      src={availableSources[sourceIndex]}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setSourceIndex((currentIndex) => currentIndex + 1)}
    />
  );
}
