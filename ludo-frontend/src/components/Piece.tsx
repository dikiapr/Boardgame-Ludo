"use client";

import { PieceResponse } from "@/types/game";

interface PieceProps {
  piece: PieceResponse;
  selectable: boolean;
  selected: boolean;
  onClick: () => void;
}

const colorMap: Record<string, string> = {
  Red: "bg-red-500 border-red-700",
  Blue: "bg-blue-500 border-blue-700",
  Green: "bg-green-500 border-green-700",
  Yellow: "bg-yellow-400 border-yellow-600",
};

export default function Piece({ piece, selectable, selected, onClick }: PieceProps) {
  const colorClass = colorMap[piece.color] || "bg-gray-400 border-gray-600";

  return (
    <button
      onClick={onClick}
      disabled={!selectable}
      className={`
        w-9 h-9 rounded-full border-2 flex items-center justify-center
        text-white text-xs font-bold shadow-md transition-all
        ${colorClass}
        ${selectable ? "cursor-pointer hover:scale-110 ring-2 ring-white animate-pulse" : ""}
        ${selected ? "ring-4 ring-yellow-300 scale-110" : ""}
        ${!selectable ? "opacity-70" : ""}
      `}
    >
      {piece.id}
    </button>
  );
}
