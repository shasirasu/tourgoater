import { useCallback, useEffect, useRef } from "react";

const DEFAULT_MASK_COLOR = [255, 247, 237];
const DEFAULT_WOBBLE = [0.14, 0.08, 0.05];
const DEFAULT_GRADIENT_STOPS = [0.95, 0.88, 0];

export default function InkReveal({
  maskColor = DEFAULT_MASK_COLOR,
  brushSize = 128,
  lifetime = 600,
  rStart = 10,
  rVary = 0.45,
  stampStep = 10,
  maxStamps = 200,
  segments = 36,
  wobble = DEFAULT_WOBBLE,
  gradientInnerRadius = 0.2,
  gradientStops = DEFAULT_GRADIENT_STOPS,
  className = "",
}) {
  const canvasRef = useRef(null);
  const stampsRef = useRef([]);
  const runningRef = useRef(false);
  const lastPosRef = useRef(null);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const animationFrameRef = useRef(null);
  const disabledRef = useRef(false);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent || disabledRef.current) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = parent.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    dimensionsRef.current = { width, height };
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.globalCompositeOperation = "source-over";
    context.fillStyle = `rgb(${maskColor.join(",")})`;
    context.fillRect(0, 0, width, height);
  }, [maskColor]);

  const carveInk = useCallback((context, x, y, radius, seed, alpha) => {
    const gradient = context.createRadialGradient(
      x,
      y,
      radius * gradientInnerRadius,
      x,
      y,
      radius,
    );
    gradient.addColorStop(0, `rgba(0,0,0,${gradientStops[0] * alpha})`);
    gradient.addColorStop(0.5, `rgba(0,0,0,${gradientStops[1] * alpha})`);
    gradient.addColorStop(1, `rgba(0,0,0,${gradientStops[2] * alpha})`);
    context.fillStyle = gradient;
    context.beginPath();

    for (let index = 0; index <= segments; index += 1) {
      const angle = (index / segments) * Math.PI * 2;
      const wobbleAmount =
        0.78 +
        wobble[0] * Math.sin(angle * 3 + seed) +
        wobble[1] * Math.sin(angle * 5 + seed * 2.1) +
        wobble[2] * Math.sin(angle * 7 + seed * 0.7);
      const pointX = x + Math.cos(angle) * radius * wobbleAmount;
      const pointY = y + Math.sin(angle) * radius * wobbleAmount;
      if (index === 0) context.moveTo(pointX, pointY);
      else context.lineTo(pointX, pointY);
    }

    context.closePath();
    context.fill();
  }, [gradientInnerRadius, gradientStops, segments, wobble]);

  const addStamp = useCallback((x, y) => {
    const stamps = stampsRef.current;
    if (stamps.length >= maxStamps) stamps.shift();
    stamps.push({
      x,
      y,
      born: performance.now(),
      seed: Math.random() * Math.PI * 2,
      maximumRadius: brushSize * (1 - rVary + Math.random() * rVary),
    });
  }, [brushSize, maxStamps, rVary]);

  const stampAlong = useCallback((x, y) => {
    const lastPosition = lastPosRef.current;
    if (!lastPosition) {
      addStamp(x, y);
    } else {
      const deltaX = x - lastPosition.x;
      const deltaY = y - lastPosition.y;
      const distance = Math.hypot(deltaX, deltaY);
      const steps = Math.max(1, Math.ceil(distance / stampStep));
      for (let index = 1; index <= steps; index += 1) {
        addStamp(
          lastPosition.x + (deltaX * index) / steps,
          lastPosition.y + (deltaY * index) / steps,
        );
      }
    }
    lastPosRef.current = { x, y };
  }, [addStamp, stampStep]);

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || disabledRef.current) {
      runningRef.current = false;
      return;
    }

    const { width, height } = dimensionsRef.current;
    const now = performance.now();
    const stamps = stampsRef.current;
    context.globalCompositeOperation = "source-over";
    context.fillStyle = `rgb(${maskColor.join(",")})`;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = "destination-out";

    for (let index = stamps.length - 1; index >= 0; index -= 1) {
      const progress = (now - stamps[index].born) / lifetime;
      if (progress >= 1) {
        stamps.splice(index, 1);
        continue;
      }
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const radius = rStart + (stamps[index].maximumRadius - rStart) * easedProgress;
      const alpha = 1 - progress * progress;
      carveInk(context, stamps[index].x, stamps[index].y, radius, stamps[index].seed, alpha);
    }

    if (stamps.length > 0) animationFrameRef.current = requestAnimationFrame(loop);
    else runningRef.current = false;
  }, [carveInk, lifetime, maskColor, rStart]);

  const startLoop = useCallback(() => {
    if (!runningRef.current && !disabledRef.current) {
      runningRef.current = true;
      animationFrameRef.current = requestAnimationFrame(loop);
    }
  }, [loop]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    disabledRef.current = reducedMotion.matches || coarsePointer.matches;
    if (!disabledRef.current) resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      stampsRef.current = [];
      runningRef.current = false;
    };
  }, [resize]);

  function getRelativePosition(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function handlePointerMove(event) {
    if (disabledRef.current) return;
    const position = getRelativePosition(event);
    stampAlong(position.x, position.y);
    startLoop();
  }

  return (
    <canvas
      ref={canvasRef}
      className={`ink-reveal-canvas ${className}`}
      aria-hidden="true"
      onPointerEnter={handlePointerMove}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => { lastPosRef.current = null; }}
    />
  );
}
