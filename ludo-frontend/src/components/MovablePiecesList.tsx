"use client";

import { MovablePieceResponse } from "@/types/game";

interface MovablePiecesListProps {
  pieces: MovablePieceResponse[];
  selectedPieceId: number | null;
  onSelect: (pieceId: number) => void;
  onConfirm: () => void;
}

export default function MovablePiecesList({
  pieces,
  selectedPieceId,
  onSelect,
  onConfirm,
}: MovablePiecesListProps) {
  if (pieces.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">Pilih pion untuk digerakkan:</h3>
      <div className="space-y-2">
        {pieces.map((p) => (
          <button
            key={p.pieceId}
            onClick={() => onSelect(p.pieceId)}
            className={`
              w-full text-left px-4 py-2 rounded-lg transition-colors text-sm
              ${
                selectedPieceId === p.pieceId
                  ? "bg-yellow-500 text-black font-semibold"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              }
            `}
          >
            Pion {p.pieceId} — {p.moveDescription}
          </button>
        ))}
      </div>
      <button
        onClick={onConfirm}
        disabled={selectedPieceId === null}
        className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold
                   hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed
                   transition-colors"
      >
        Gerakkan Pion
      </button>
    </div>
  );
}
