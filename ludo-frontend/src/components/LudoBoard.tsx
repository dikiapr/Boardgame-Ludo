"use client";

import { PieceResponse } from "@/types/game";

// ===== 52 GLOBAL TRACK POSITIONS (clockwise) =====
const TRACK: [number, number][] = [
  [6,1],[6,2],[6,3],[6,4],[6,5],
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],[6,0],
];

// ===== HOME STRETCH (steps 52-57, 6 tiles toward center) =====
const HOME_STRETCH: Record<string, [number, number][]> = {
  Red:    [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  Blue:   [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  Green:  [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
  Yellow: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
};

const START_OFFSETS: Record<string, number> = {
  Red: 0, Blue: 13, Green: 26, Yellow: 39,
};

// ===== BASE PIECE SPOTS (4 per color, indexed by piece.id - 1) =====
const BASE_SPOTS: Record<string, [number, number][]> = {
  Red:    [[2,2],[2,3],[3,2],[3,3]],
  Blue:   [[2,11],[2,12],[3,11],[3,12]],
  Green:  [[11,11],[11,12],[12,11],[12,12]],
  Yellow: [[11,2],[11,3],[12,2],[12,3]],
};

// ===== PRE-COMPUTED LOOKUPS =====
const trackByPos = new Map<string, number>();
TRACK.forEach(([r, c], i) => trackByPos.set(`${r}-${c}`, i));

const homeByPos = new Map<string, string>();
for (const [color, positions] of Object.entries(HOME_STRETCH)) {
  for (const [r, c] of positions) homeByPos.set(`${r}-${c}`, color);
}

const baseSpotByPos = new Map<string, string>();
for (const [color, spots] of Object.entries(BASE_SPOTS)) {
  for (const [r, c] of spots) baseSpotByPos.set(`${r}-${c}`, color);
}

const SAFE_INDICES = new Set([0, 13, 26, 39]);
const SAFE_COLORS: Record<number, string> = {
  0: "Red", 13: "Blue", 26: "Green", 39: "Yellow",
};

// ===== COLOR CONSTANTS =====
const HOME_BG: Record<string, string> = {
  Red: "bg-red-300", Blue: "bg-blue-300", Green: "bg-green-300", Yellow: "bg-yellow-200",
};
const SAFE_BG: Record<string, string> = {
  Red: "bg-red-200", Blue: "bg-blue-200", Green: "bg-green-200", Yellow: "bg-yellow-100",
};
const PIECE_BG: Record<string, string> = {
  Red: "bg-red-600", Blue: "bg-blue-600", Green: "bg-green-600", Yellow: "bg-yellow-500",
};
const PIECE_BORDER: Record<string, string> = {
  Red: "border-red-800", Blue: "border-blue-800", Green: "border-green-800", Yellow: "border-yellow-700",
};
const SPOT_BORDER: Record<string, string> = {
  Red: "border-red-400", Blue: "border-blue-400", Green: "border-green-400", Yellow: "border-yellow-300",
};

// ===== POSITION CALCULATION =====
function getPiecePosition(piece: PieceResponse): [number, number] | null {
  if (piece.state === "Base") {
    const spots = BASE_SPOTS[piece.color];
    return spots ? spots[piece.id - 1] : null;
  }
  if (piece.state === "Finished") {
    const hs = HOME_STRETCH[piece.color];
    return hs ? hs[5] : null;
  }
  const step = piece.currentStep;
  if (step >= 52) {
    const hs = HOME_STRETCH[piece.color];
    return hs ? hs[step - 52] : null;
  }
  const offset = START_OFFSETS[piece.color] ?? 0;
  const globalPos = (offset + step - 1) % 52;
  return TRACK[globalPos] ?? null;
}

// ===== CELL BACKGROUND =====
function getCellBg(row: number, col: number): string {
  const key = `${row}-${col}`;

  // Center 3x3
  if (row >= 6 && row <= 8 && col >= 6 && col <= 8) {
    if (row === 7 && col === 7) return "bg-white";
    if ((row === 6 && col === 6) || (row === 7 && col === 6)) return "bg-red-400";
    if ((row === 6 && col === 7) || (row === 6 && col === 8)) return "bg-blue-400";
    if ((row === 7 && col === 8) || (row === 8 && col === 8)) return "bg-green-400";
    if ((row === 8 && col === 6) || (row === 8 && col === 7)) return "bg-yellow-300";
    return "bg-white";
  }

  // Home stretches
  const homeColor = homeByPos.get(key);
  if (homeColor) return HOME_BG[homeColor];

  // Base areas
  if (row <= 5 && col <= 5) {
    return (row >= 1 && row <= 4 && col >= 1 && col <= 4) ? "bg-white" : "bg-red-500";
  }
  if (row <= 5 && col >= 9) {
    return (row >= 1 && row <= 4 && col >= 10 && col <= 13) ? "bg-white" : "bg-blue-500";
  }
  if (row >= 9 && col >= 9) {
    return (row >= 10 && row <= 13 && col >= 10 && col <= 13) ? "bg-white" : "bg-green-500";
  }
  if (row >= 9 && col <= 5) {
    return (row >= 10 && row <= 13 && col >= 1 && col <= 4) ? "bg-white" : "bg-yellow-400";
  }

  // Safe/start tiles
  const trackIdx = trackByPos.get(key);
  if (trackIdx !== undefined && SAFE_INDICES.has(trackIdx)) {
    return SAFE_BG[SAFE_COLORS[trackIdx]];
  }

  // Regular track
  return "bg-gray-50";
}

// ===== COMPONENT =====
interface LudoBoardProps {
  pieces: Record<string, PieceResponse[]>;
  movablePieceIds: number[];
  selectedPieceId: number | null;
  currentPlayerColor: string;
  onPieceSelect: (pieceId: number) => void;
}

export default function LudoBoard({
  pieces,
  movablePieceIds,
  selectedPieceId,
  currentPlayerColor,
  onPieceSelect,
}: LudoBoardProps) {
  // Map all pieces to (row,col)
  const pieceMap = new Map<string, PieceResponse[]>();
  for (const colorPieces of Object.values(pieces)) {
    for (const piece of colorPieces) {
      const pos = getPiecePosition(piece);
      if (!pos) continue;
      const key = `${pos[0]}-${pos[1]}`;
      const arr = pieceMap.get(key) || [];
      arr.push(piece);
      pieceMap.set(key, arr);
    }
  }

  return (
    <div className="aspect-square w-full max-w-[520px] mx-auto select-none">
      <div
        className="w-full h-full grid rounded-lg overflow-hidden shadow-2xl border-2 border-gray-700"
        style={{
          gridTemplateColumns: "repeat(15, 1fr)",
          gridTemplateRows: "repeat(15, 1fr)",
        }}
      >
        {Array.from({ length: 225 }, (_, i) => {
          const row = Math.floor(i / 15);
          const col = i % 15;
          const key = `${row}-${col}`;
          const bg = getCellBg(row, col);
          const piecesHere = pieceMap.get(key) || [];
          const baseSpot = baseSpotByPos.get(key);
          const trackIdx = trackByPos.get(key);
          const isSafe = trackIdx !== undefined && SAFE_INDICES.has(trackIdx);
          const isCenter = row === 7 && col === 7;

          return (
            <div
              key={key}
              className={`relative flex items-center justify-center ${bg} border-[0.5px] border-black/10 overflow-hidden`}
            >
              {/* Empty base spot circle */}
              {baseSpot && piecesHere.length === 0 && (
                <div
                  className={`w-[65%] h-[65%] rounded-full border-2 ${SPOT_BORDER[baseSpot]} opacity-40`}
                />
              )}

              {/* Safe tile star */}
              {isSafe && piecesHere.length === 0 && (
                <span className="text-[10px] font-bold opacity-50">★</span>
              )}

              {/* Center home icon */}
              {isCenter && piecesHere.length === 0 && (
                <span className="text-xs">🏠</span>
              )}

              {/* Pieces */}
              {piecesHere.length > 0 && (
                <div
                  className={`absolute inset-0 flex items-center justify-center ${
                    piecesHere.length > 1
                      ? "flex-wrap gap-[1px] p-[1px]"
                      : ""
                  }`}
                >
                  {piecesHere.map((p) => {
                    const isMovable =
                      movablePieceIds.includes(p.id) &&
                      p.color === currentPlayerColor;
                    const isSelected =
                      selectedPieceId === p.id &&
                      p.color === currentPlayerColor;
                    const sizeClass =
                      piecesHere.length === 1
                        ? "w-[70%] h-[70%] text-[8px]"
                        : piecesHere.length <= 2
                        ? "w-[46%] h-[46%] text-[6px]"
                        : "w-[40%] h-[40%] text-[5px]";

                    return (
                      <button
                        key={`${p.color}-${p.id}`}
                        onClick={() => isMovable && onPieceSelect(p.id)}
                        disabled={!isMovable}
                        className={`
                          ${sizeClass} rounded-full flex items-center justify-center
                          text-white font-bold shadow border
                          ${PIECE_BG[p.color]} ${PIECE_BORDER[p.color]}
                          ${
                            isMovable && !isSelected
                              ? "animate-pulse cursor-pointer ring-1 ring-white z-10"
                              : ""
                          }
                          ${
                            isSelected
                              ? "ring-2 ring-yellow-300 scale-125 z-20 cursor-pointer"
                              : ""
                          }
                          ${!isMovable ? "cursor-default" : ""}
                        `}
                      >
                        {p.id}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
