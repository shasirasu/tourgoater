import { useEffect, useMemo, useState } from "react";

const RESPONSIVE_WIDTHS = [640, 960, 1280, 1920, 2560, 3840];

function canOptimize(source) {
  return /^https?:\/\//i.test(source) && !source.includes("wsrv.nl/");
}

function optimizedUrl(source, width) {
  return `https://wsrv.nl/?url=${encodeURIComponent(source)}&w=${width}&output=webp&q=88`;
}

export default function SafeImage({ sources, alt, fallbackLabel, sizes = "100vw", className = "", onLoad, loading, ...imageProps }) {
  const sourceKey = (Array.isArray(sources) ? sources : [sources]).filter(Boolean).join("\n");
  const availableSources = useMemo(
    () => sourceKey.split("\n").filter(Boolean),
    [sourceKey],
  );
  const candidates = useMemo(() => availableSources.flatMap((source) => canOptimize(source)
    ? [{
        src: optimizedUrl(source, 1920),
        srcSet: RESPONSIVE_WIDTHS.map((width) => `${optimizedUrl(source, width)} ${width}w`).join(", "),
      }, { src: source }]
    : [{ src: source }]), [availableSources]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [sourceKey]);

  if (!candidates[candidateIndex]) {
    return (
      <div
        className={`image-fallback ${className}`}
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
      className={`safe-image ${className}`.trim()}
      src={candidates[candidateIndex].src}
      srcSet={candidates[candidateIndex].srcSet}
      sizes={candidates[candidateIndex].srcSet ? sizes : undefined}
      alt={alt}
      loading={loading ?? (imageProps.fetchPriority === "high" ? "eager" : "lazy")}
      decoding="async"
      referrerPolicy="no-referrer"
      onLoad={onLoad}
      onError={() => {
        setCandidateIndex((currentIndex) => currentIndex + 1);
      }}
    />
  );
}
