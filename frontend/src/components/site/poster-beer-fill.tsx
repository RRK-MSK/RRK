"use client";

import { useEffect, useId, useRef } from "react";

const WIDTH = 200;
const HEIGHT = 200;
const POINTS = 36;
const MAX_TILT = 0.92;
const SPRING = 11;
const DAMPING = 4.6;

type DeviceOrientationConstructor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<PermissionState>;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function requestTiltPermission() {
  const requestPermission = (DeviceOrientationEvent as DeviceOrientationConstructor).requestPermission;
  if (typeof requestPermission !== "function") {
    return;
  }

  void requestPermission().catch(() => undefined);
}

function surfaceY(
  x: number,
  tilt: number,
  slosh: number,
  time: number,
) {
  const nx = x / WIDTH - 0.5;
  const level = 96 + slosh * 0.12;
  const slope = tilt * nx * 78;
  const energy = 3.2 + Math.abs(slosh) * 0.22 + Math.abs(tilt) * 4;
  const waves =
    Math.sin(nx * Math.PI * 2.1 + time * 2.05) * energy
    + Math.sin(nx * Math.PI * 3.6 + time * 3.15 + slosh * 0.04) * (energy * 0.42)
    + Math.sin(nx * Math.PI * 5.8 + time * 4.4) * 1.4;

  return clamp(level + slope + waves, 38, 148);
}

function buildLiquidPath(tilt: number, slosh: number, time: number) {
  const points: string[] = [];

  for (let index = 0; index <= POINTS; index += 1) {
    const x = (index / POINTS) * WIDTH;
    const y = surfaceY(x, tilt, slosh, time);
    points.push(`${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  return `${points.join(" ")} L${WIDTH} ${HEIGHT} L0 ${HEIGHT} Z`;
}

function buildFoamPath(tilt: number, slosh: number, time: number) {
  const top: string[] = [];
  const bottom: string[] = [];

  for (let index = 0; index <= POINTS; index += 1) {
    const x = (index / POINTS) * WIDTH;
    const y = surfaceY(x, tilt, slosh, time);
    const nx = x / WIDTH;
    const puff = 7 + Math.sin(nx * Math.PI * 6 + time * 2.6) * 3.2 + Math.sin(nx * Math.PI * 3 + time) * 2;
    top.push(`${index === 0 ? "M" : "L"}${x.toFixed(2)} ${(y - puff).toFixed(2)}`);
    bottom.push(`L${(WIDTH - x).toFixed(2)} ${surfaceY(WIDTH - x, tilt, slosh, time).toFixed(2)}`);
  }

  return `${top.join(" ")} ${bottom.join(" ")} Z`;
}

function buildShinePath(tilt: number, slosh: number, time: number) {
  const points: string[] = [];

  for (let index = 0; index <= POINTS; index += 1) {
    const x = (index / POINTS) * WIDTH;
    const y = surfaceY(x, tilt, slosh, time) + 1.1;
    points.push(`${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  return points.join(" ");
}

export function PosterBeerFill() {
  const reactId = useId().replace(/:/g, "");
  const bodyRef = useRef<SVGPathElement>(null);
  const foamRef = useRef<SVGPathElement>(null);
  const shineRef = useRef<SVGPathElement>(null);
  const clipRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const target = { tilt: 0, level: 0 };
    const state = {
      tilt: 0,
      tiltVel: 0,
      slosh: 0,
      sloshVel: 0,
      lastTilt: 0,
    };
    let lastTime = performance.now();
    let frame = 0;

    const draw = (time: number) => {
      const body = bodyRef.current;
      const foam = foamRef.current;
      const shine = shineRef.current;
      const clip = clipRef.current;
      if (!body || !foam || !shine || !clip) {
        return;
      }

      const seconds = time / 1000;
      const d = buildLiquidPath(state.tilt, state.slosh, seconds);
      body.setAttribute("d", d);
      clip.setAttribute("d", d);
      foam.setAttribute("d", buildFoamPath(state.tilt, state.slosh, seconds));
      shine.setAttribute("d", buildShinePath(state.tilt, state.slosh, seconds));
    };

    const tick = (time: number) => {
      const dt = clamp((time - lastTime) / 1000, 0.008, 0.034);
      lastTime = time;

      const idle = Math.sin(time / 760) * 0.08 + Math.sin(time / 1180) * 0.04;
      const nextTilt = target.tilt + (Math.abs(target.tilt) < 0.12 ? idle : 0);

      state.tiltVel += (nextTilt - state.tilt) * SPRING * dt;
      state.tiltVel *= Math.exp(-DAMPING * dt);
      state.tilt += state.tiltVel * dt;

      state.sloshVel += (target.level - state.slosh) * 7 * dt - state.sloshVel * 2.4 * dt;
      state.slosh += state.sloshVel * dt;

      draw(time);
      frame = window.requestAnimationFrame(tick);
    };

    const setTargetFromTilt = (gamma: number, beta: number) => {
      const nextTilt = clamp(gamma / 28, -MAX_TILT, MAX_TILT);
      const impulse = nextTilt - state.lastTilt;
      if (Math.abs(impulse) > 0.035) {
        state.sloshVel += impulse * 86;
        state.tiltVel += impulse * 4.5;
      }
      state.lastTilt = nextTilt;
      target.tilt = nextTilt;
      target.level = clamp((beta - 50) * 0.55, -18, 16);
    };

    const onOrientation = (event: DeviceOrientationEvent) => {
      setTargetFromTilt(event.gamma ?? 0, event.beta ?? 45);
    };

    const onMouseMove = (event: MouseEvent) => {
      if (window.matchMedia("(pointer: coarse)").matches) {
        return;
      }

      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      setTargetFromTilt(x * 22, 50 + y * 16);
    };

    window.addEventListener("deviceorientation", onOrientation);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("pointerdown", requestTiltPermission, { once: true });
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("pointerdown", requestTiltPermission);
    };
  }, []);

  return (
    <div className="poster-beer-fill" aria-hidden="true">
      <div className="poster-beer-glass" />
      <svg className="poster-beer-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`beer-body-${reactId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f6d36a" />
            <stop offset="14%" stopColor="#e39b24" />
            <stop offset="42%" stopColor="#c86d10" />
            <stop offset="78%" stopColor="#8a4209" />
            <stop offset="100%" stopColor="#4e2405" />
          </linearGradient>
          <linearGradient id={`beer-foam-${reactId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fffdf6" />
            <stop offset="55%" stopColor="#f3ddb0" />
            <stop offset="100%" stopColor="#d9a24a" />
          </linearGradient>
          <clipPath id={`beer-clip-${reactId}`}>
            <path ref={clipRef} d={buildLiquidPath(0, 0, 0)} />
          </clipPath>
        </defs>
        <path ref={bodyRef} d={buildLiquidPath(0, 0, 0)} fill={`url(#beer-body-${reactId})`} />
        <path
          ref={foamRef}
          d={buildFoamPath(0, 0, 0)}
          fill={`url(#beer-foam-${reactId})`}
          opacity="0.96"
        />
        <path
          ref={shineRef}
          d={buildShinePath(0, 0, 0)}
          fill="none"
          stroke="rgba(255,255,255,0.42)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      <div className="poster-beer-bubbles" style={{ clipPath: `url(#beer-clip-${reactId})` }} />
    </div>
  );
}
