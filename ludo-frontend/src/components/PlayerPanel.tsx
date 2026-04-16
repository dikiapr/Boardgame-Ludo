"use client";

import { PlayerResponse, PieceResponse } from "@/types/game";
import Piece from "./Piece";

interface PlayerPanelProps {
  player: PlayerResponse;
  pieces: PieceResponse[];
  isCurrentTurn: boolean;
  movablePieceIds: number[];
  selectedPieceId: number | null;
  onPieceSelect: (pieceId: number) => void;
}

const colorBorder: Record<string, string> = {
  Red: "border-red-500",
  Blue: "border-blue-500",
  Green: "border-green-500",
  Yellow: "border-yellow-400",
};

const colorBg: Record<string, string> = {
  Red: "bg-red-500/10",
  Blue: "bg-blue-500/10",
  Green: "bg-green-500/10",
  Yellow: "bg-yellow-400/10",
};

function stateLabel(state: string, step: number): string {
  if (state === "Base") return "BASE";
  if (state === "Finished") return "DONE";
  if (step > 51) return `Home ${step - 51}`;
  return `Step ${step}`;
}

export default function PlayerPanel({
  player,
  pieces,
  isCurrentTurn,
  movablePieceIds,
  selectedPieceId,
  onPieceSelect,
}: PlayerPanelProps) {
  const border = colorBorder[player.color] || "border-gray-400";
  const bg = colorBg[player.color] || "bg-gray-100";

  return (
    <div
      className={`
        rounded-xl border-2 p-4 transition-all
        ${border} ${bg}
        ${isCurrentTurn ? "ring-2 ring-offset-2 ring-yellow-400 shadow-lg" : "opacity-75"}
      `}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="font-bold text-lg">{player.name}</span>
        <span className="text-sm text-gray-500">({player.color})</span>
        {player.isBot && (
          <span className="text-xs bg-gray-700 text-white px-2 py-0.5 rounded-full">BOT</span>
        )}
        {isCurrentTurn && (
          <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-semibold">
            GILIRAN
          </span>
        )}
      </div>

      <div className="flex gap-3">
        {pieces.map((piece) => (
          <div key={piece.id} className="flex flex-col items-center gap-1">
            <Piece
              piece={piece}
              selectable={isCurrentTurn && movablePieceIds.includes(piece.id)}
              selected={selectedPieceId === piece.id}
              onClick={() => onPieceSelect(piece.id)}
            />
            <span className="text-[10px] text-gray-500 font-mono">
              {stateLabel(piece.state, piece.currentStep)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
