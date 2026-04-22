"use client";

import { useState, useEffect } from "react";

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 28], [72, 28], [28, 50], [72, 50], [28, 72], [72, 72]],
};

// Companion faces shown on right and top (standard dice: opposite faces sum to 7)
const RIGHT_FACE: Record<number, number> = { 1: 3, 2: 4, 3: 1, 4: 2, 5: 4, 6: 3 };
const TOP_FACE: Record<number, number> = { 1: 2, 2: 6, 3: 5, 4: 3, 5: 2, 6: 5 };

// Transform a dot from [0-100, 0-100] face space into SVG space using a parallelogram
// defined by origin + u-vector + v-vector
function td(
  dotX: number, dotY: number,
  ox: number, oy: number,
  ux: number, uy: number,
  vx: number, vy: number,
): [number, number] {
  const u = dotX / 100;
  const v = dotY / 100;
  return [ox + ux * u + vx * v, oy + uy * u + vy * v];
}

interface DiceProps {
  value: number | null;
  rolling: boolean;
  onRoll: () => void;
  disabled: boolean;
}

// Cube corners (viewBox "-10 -8 148 125"):
//   top-center : (65,  8)
//   left       : (20, 30)
//   center     : (65, 52)   ← inner vertex
//   right      : (110,30)
//   bottom-left: (20, 76)
//   bottom-ctr : (65, 98)
//   bottom-rgt : (110,76)
//
// Left face  : (20,30) → (65,52) → (65,98) → (20,76)
//   P(u,v) = (20,30) + u·(45,22) + v·(0,46)
//
// Right face : (65,52) → (110,30) → (110,76) → (65,98)
//   P(u,v) = (65,52) + u·(45,-22) + v·(0,46)
//
// Top face   : (20,30) → (65,8) → (110,30) → (65,52)  [rhombus]
//   P(u,v) = (20,30) + u·(45,-22) + v·(45,22)

function Dice3DSVG({ value }: { value: number }) {
  const mainDots = (DOT_POSITIONS[value] ?? []).map(([x, y]) =>
    td(x, y, 20, 30, 45, 22, 0, 46)
  );
  const rightDots = (DOT_POSITIONS[RIGHT_FACE[value] ?? 3] ?? []).map(([x, y]) =>
    td(x, y, 65, 52, 45, -22, 0, 46)
  );
  const topDots = (DOT_POSITIONS[TOP_FACE[value] ?? 2] ?? []).map(([x, y]) =>
    td(x, y, 20, 30, 45, -22, 45, 22)
  );

  return (
    <svg viewBox="-10 -8 148 125" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Soft warm shadow */}
        <filter id="dShadow" x="-30%" y="-20%" width="180%" height="180%">
          <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#2C2416" floodOpacity="0.2" />
        </filter>
        {/* Subtle inner highlight for left face */}
        <linearGradient id="lgLeft" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#f5f2ec" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="lgTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5f1e8" />
          <stop offset="100%" stopColor="#e8e2d8" />
        </linearGradient>
        <linearGradient id="lgRight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4ccc0" />
          <stop offset="100%" stopColor="#c8bfb2" />
        </linearGradient>
      </defs>

      <g filter="url(#dShadow)">
        {/* ── Top face ── */}
        <polygon
          points="65,8 110,30 65,52 20,30"
          fill="url(#lgTop)"
          stroke="#BFB8AD"
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
        {topDots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.2} fill="#9E9589" />
        ))}

        {/* ── Left face (main — current value) ── */}
        <polygon
          points="20,30 65,52 65,98 20,76"
          fill="url(#lgLeft)"
          stroke="#BFB8AD"
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
        {mainDots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3.6} fill="#2C2416" />
        ))}

        {/* ── Right face ── */}
        <polygon
          points="65,52 110,30 110,76 65,98"
          fill="url(#lgRight)"
          stroke="#BFB8AD"
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
        {rightDots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.2} fill="#7D766A" />
        ))}
      </g>

      {/* ── Edge highlights (top edges) ── */}
      <polyline
        points="20,30 65,8 110,30"
        fill="none"
        stroke="rgba(255,255,255,0.75)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left top edge */}
      <line x1="20" y1="30" x2="65" y2="52" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
    </svg>
  );
}

export default function Dice({ value, rolling, onRoll, disabled }: DiceProps) {
  const [displayValue, setDisplayValue] = useState<number>(value ?? 6);

  useEffect(() => {
    if (!rolling) {
      if (value !== null) setDisplayValue(value);
      return;
    }
    const interval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
    }, 90);
    return () => clearInterval(interval);
  }, [rolling, value]);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div
        className={`select-none transition-opacity duration-300 ${rolling ? "dice-rolling" : ""}`}
        style={{ width: "160px", height: "140px", opacity: value || rolling ? 1 : 0.5 }}
      >
        <Dice3DSVG value={displayValue} />
      </div>

      <button
        onClick={onRoll}
        disabled={disabled || rolling}
        className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 active:scale-[0.97]"
        style={{
          backgroundColor: disabled || rolling ? "#DDD8CC" : "#FFD23F",
          color: disabled || rolling ? "#A8A099" : "#2C2416",
          cursor: disabled || rolling ? "not-allowed" : "pointer",
        }}
      >
        {rolling ? "Melempar..." : "🎲 Lempar Dadu"}
      </button>
    </div>
  );
}
