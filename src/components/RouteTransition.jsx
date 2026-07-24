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
          <img src="/images/branding/tg-logo.png" alt="" width="54" height="54" />
        </span>
        <span>Tourgoater</span>
      </div>
    </div>
  );
}
