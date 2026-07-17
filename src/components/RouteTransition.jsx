import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import transitionImage from "../assets/tourgoater-transition.png";

const TRANSITION_DURATION = 420;

export default function RouteTransition() {
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const timeoutRef = useRef(null);
  const [transition, setTransition] = useState(null);

  useEffect(() => {
    const image = new Image();
    image.src = transitionImage;
  }, []);

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
      <img
        className="route-transition-backdrop"
        src={transitionImage}
        alt=""
        width="1920"
        height="1080"
      />
      <div className="route-transition-media">
        <img
          className="route-transition-image"
          src={transitionImage}
          alt=""
          width="1792"
          height="1024"
        />
      </div>
    </div>
  );
}
