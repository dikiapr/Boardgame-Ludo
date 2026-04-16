"use client";

interface DiceProps {
  value: number | null;
  rolling: boolean;
  onRoll: () => void;
  disabled: boolean;
}

// Dot positions for each dice face (cx, cy on a 100x100 grid)
const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 28], [72, 28], [28, 50], [72, 50], [28, 72], [72, 72]],
};

function DiceFace({ value }: { value: number }) {
  const dots = DOT_POSITIONS[value] ?? [];
  const isOne = value === 1;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Dice body */}
      <rect
        x="2" y="2" width="96" height="96" rx="16" ry="16"
        fill="white"
        stroke="#333"
        strokeWidth="3"
      />
      {/* Inner shadow */}
      <rect
        x="5" y="5" width="90" height="90" rx="14" ry="14"
        fill="none"
        stroke="#e0e0e0"
        strokeWidth="1"
      />
      {/* Dots */}
      {dots.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={isOne ? 12 : 9}
          fill={isOne ? "#e11d48" : "#1a1a1a"}
        />
      ))}
    </svg>
  );
}

export default function Dice({ value, rolling, onRoll, disabled }: DiceProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`w-18 h-18 select-none drop-shadow-lg transition-transform duration-200 ${
          rolling ? "animate-bounce" : ""
        } ${!value ? "opacity-40" : ""}`}
        style={{ width: "72px", height: "72px" }}
      >
        <DiceFace value={value ?? 2} />
      </div>
      <button
        onClick={onRoll}
        disabled={disabled || rolling}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold
                   hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                   transition-colors"
      >
        {rolling ? "Melempar..." : "Lempar Dadu"}
      </button>
    </div>
  );
}
