import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const TRANSITION_DURATION = 560;

export default function RouteTransition() {
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const timeoutRef = useRef(null);
  const [transition, setTransition] = useState(null);

  useEffect(() => {
    if (previousPathRef.current === location.pathname) return undefined;
    previousPathRef.current = location.pathname;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTransition(null);
      return undefined;
    }

    setTransition({ key: location.key });

    timeoutRef.current = window.setTimeout(() => {
      setTransition(null);
    }, TRANSITION_DURATION);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [location.key, location.pathname]);

  if (!transition) return null;

  return (
    <div className="route-transition" aria-hidden="true" key={transition.key}>
      <div className="route-transition-curtain" />
      <div className="route-transition-brand">
        <span className="route-transition-mark">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
            <path d="m9.7 12.3 1.2-4.1 3.4-1.6-1.2 4.2-3.4 1.5Z" />
          </svg>
        </span>
        <span>Tourgoater</span>
      </div>
    </div>
  );
}
