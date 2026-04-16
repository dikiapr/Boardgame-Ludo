"use client";

interface DiceProps {
  value: number | null;
  rolling: boolean;
  onRoll: () => void;
  disabled: boolean;
}

const diceFaces: Record<number, string> = {
  1: "⚀",
  2: "⚁",
  3: "⚂",
  4: "⚃",
  5: "⚄",
  6: "⚅",
};

export default function Dice({ value, rolling, onRoll, disabled }: DiceProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`text-7xl select-none transition-transform duration-200 ${
          rolling ? "animate-bounce" : ""
        }`}
      >
        {value ? diceFaces[value] : "🎲"}
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
