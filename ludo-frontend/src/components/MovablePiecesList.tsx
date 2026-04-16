"use client";

import { MovablePieceResponse } from "@/types/game";

interface MovablePiecesListProps {
  pieces: MovablePieceResponse[];
  selectedPieceId: number | null;
  onSelect: (pieceId: number) => void;
  onConfirm: () => void;
}

const stateLabel: Record<string, string> = {
  Base: "🏠 Di Markas",
  Active: "🚶 Di Papan",
  Finished: "🏁 Selesai",
};

export default function MovablePiecesList({
  pieces,
  selectedPieceId,
  onSelect,
  onConfirm,
}: MovablePiecesListProps) {
  if (pieces.length === 0) return null;

  return (
    <div className="bg-gradient-to-b from-gray-800 to-gray-800/80 rounded-xl p-4 space-y-3 border border-gray-700/50">
      <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        Pilih pion untuk digerakkan
      </h3>

      <div className="space-y-1.5">
        {pieces.map((p) => {
          const selected = selectedPieceId === p.pieceId;
          return (
            <button
              key={p.pieceId}
              onClick={() => onSelect(p.pieceId)}
              className={`
                w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 text-sm
                flex items-center gap-3 group
                ${
                  selected
                    ? "bg-yellow-500/20 border border-yellow-500 text-yellow-200 shadow-[0_0_12px_rgba(234,179,8,0.15)]"
                    : "bg-gray-700/50 border border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-600"
                }
              `}
            >
              {/* Piece number badge */}
              <span
                className={`
                  shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  transition-all duration-150
                  ${
                    selected
                      ? "bg-yellow-500 text-black shadow-md"
                      : "bg-gray-600 text-gray-300 group-hover:bg-gray-500"
                  }
                `}
              >
                {p.pieceId}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{p.moveDescription}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {stateLabel[p.currentState] ?? p.currentState}
                  {p.currentState === "Active" && ` • Langkah ke-${p.currentStep}`}
                </div>
              </div>

              {/* Check indicator */}
              {selected && (
                <span className="shrink-0 text-yellow-400 text-base">✓</span>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={onConfirm}
        disabled={selectedPieceId === null}
        className={`
          w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200
          ${
            selectedPieceId !== null
              ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-900/30 active:scale-[0.98]"
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }
        `}
      >
        {selectedPieceId !== null ? "🎯 Gerakkan Pion" : "Pilih pion terlebih dahulu"}
      </button>
    </div>
  );
}
