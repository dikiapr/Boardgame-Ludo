"use client";

import { PieceResponse, MovablePieceResponse } from "@/types/game";

interface MovablePiecesListProps {
  allPieces: PieceResponse[];
  movablePieces: MovablePieceResponse[];
  diceValue: number | null;
  onSelect: (pieceId: number) => void;
}

const stateLabel: Record<string, string> = {
  Base: "Di Markas",
  Active: "Di Papan",
  Finished: "Tamat",
};

function getSubtitle(
  piece: PieceResponse,
  movable: MovablePieceResponse | undefined,
  diceValue: number | null
): string {
  if (!movable) {
    if (piece.state === "Finished") return "Selesai";
    if (piece.state === "Base") return "Menunggu angka 6";
    return "Aman";
  }
  if (piece.state === "Base") return "Siap Keluar";
  if (piece.state === "Finished") return "Selesai";
  if (diceValue) return `Maju ${diceValue} Langkah`;
  return movable.moveDescription;
}

export default function MovablePiecesList({
  allPieces,
  movablePieces,
  diceValue,
  onSelect,
}: MovablePiecesListProps) {
  if (allPieces.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: "#5C5246" }}>
          Pilih pion untuk digerakkan
        </span>
        {diceValue !== null && (
          <span
            className="text-xs px-2.5 py-1 rounded-md font-mono font-semibold"
            style={{ backgroundColor: "#FFD23F", color: "#2C2416" }}
          >
            Dadu: {diceValue}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {allPieces.map((piece) => {
          const movable = movablePieces.find((m) => m.pieceId === piece.id);
          const isMovable = !!movable;
          const subtitle = getSubtitle(piece, movable, diceValue);

          return (
            <div
              key={piece.id}
              className="flex items-center gap-3 p-3 rounded-xl border transition-all"
              style={{
                borderColor: isMovable ? "#FF9F1C" : "#E8E2D6",
                backgroundColor: isMovable ? "#FFF8EE" : "#F5F0E6",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                style={
                  isMovable
                    ? { backgroundColor: "#FF9F1C", color: "#fff" }
                    : { backgroundColor: "#E8E2D6", color: "#A8A099" }
                }
              >
                {piece.id}
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className="font-bold text-sm"
                  style={{ color: isMovable ? "#2C2416" : "#A8A099" }}
                >
                  {stateLabel[piece.state] ?? piece.state}
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: isMovable ? "#7D766A" : "#C0B9B0" }}
                >
                  {isMovable ? `→ ${subtitle}` : subtitle}
                </div>
              </div>

              {isMovable && (
                <button
                  onClick={() => onSelect(piece.id)}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all active:scale-95 shrink-0"
                  style={{ backgroundColor: "#EDE8DC", color: "#2C2416" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#DDD8CC")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#EDE8DC")
                  }
                >
                  Pilih
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
