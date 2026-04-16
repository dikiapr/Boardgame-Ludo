"use client";

import { PieceResponse } from "@/types/game";

// ===== 52 GLOBAL TRACK POSITIONS (clockwise, [row, col]) =====
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

// ===== SVG COLOR LAYOUT: Green=top-left, Yellow=top-right, Red=bottom-left, Blue=bottom-right =====
const HOME_STRETCH: Record<string, [number, number][]> = {
  Green:  [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  Yellow: [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  Red:    [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
  Blue:   [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
};

const START_OFFSETS: Record<string, number> = {
  Green: 0, Yellow: 13, Blue: 26, Red: 39,
};

const BASE_SPOTS: Record<string, [number, number][]> = {
  Green:  [[2,2],[2,3],[3,2],[3,3]],
  Yellow: [[2,11],[2,12],[3,11],[3,12]],
  Red:    [[11,2],[11,3],[12,2],[12,3]],
  Blue:   [[11,11],[11,12],[12,11],[12,12]],
};

// ===== PIECE STYLE CONSTANTS =====
const PIECE_COLORS: Record<string, string> = {
  Red: "#f30f00", Blue: "#008cf8", Green: "#00a300", Yellow: "#ffc400",
};
const PIECE_BORDER_COLORS: Record<string, string> = {
  Red: "#a00a00", Blue: "#005fa8", Green: "#006800", Yellow: "#b89000",
};

// ===== SVG COORDINATE MAPPING =====
// SVG viewBox: 0 0 1000 1000, grid origin (33.617, 34.494), cell size 62.088
function cellToPercent(row: number, col: number): { left: string; top: string } {
  const x = (33.617 + col * 62.088 + 31.044) / 10;
  const y = (34.494 + row * 62.088 + 31.044) / 10;
  return { left: `${x}%`, top: `${y}%` };
}

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

// ===== STACK OFFSETS for multiple pieces on same cell =====
const STACK_OFFSETS: { dx: number; dy: number }[] = [
  { dx: -1.2, dy: -1.2 },
  { dx: 1.2, dy: -1.2 },
  { dx: -1.2, dy: 1.2 },
  { dx: 1.2, dy: 1.2 },
];

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
  // Group pieces by grid position
  const piecesByPos = new Map<string, PieceResponse[]>();
  for (const colorPieces of Object.values(pieces)) {
    for (const piece of colorPieces) {
      const pos = getPiecePosition(piece);
      if (!pos) continue;
      const key = `${pos[0]}-${pos[1]}`;
      const arr = piecesByPos.get(key) || [];
      arr.push(piece);
      piecesByPos.set(key, arr);
    }
  }

  return (
    <div className="w-full h-full select-none">
      <div className="relative w-full h-full">
        {/* SVG Board Background */}
        <img
          src="/ludo-board.svg"
          alt="Ludo Board"
          className="w-full h-full rounded-lg shadow-2xl"
          draggable={false}
        />

        {/* Piece Overlays */}
        {Array.from(piecesByPos.entries()).flatMap(([posKey, piecesHere]) => {
          const [row, col] = posKey.split("-").map(Number);
          const { left, top } = cellToPercent(row, col);
          const stacked = piecesHere.length > 1;

          return piecesHere.map((p, idx) => {
            const isMovable =
              movablePieceIds.includes(p.id) && p.color === currentPlayerColor;
            const isSelected =
              selectedPieceId === p.id && p.color === currentPlayerColor;

            const offset = stacked ? STACK_OFFSETS[idx % 4] : { dx: 0, dy: 0 };
            const size = stacked ? "3%" : "4.2%";

            return (
              <button
                key={`${p.color}-${p.id}`}
                onClick={() => isMovable && onPieceSelect(p.id)}
                disabled={!isMovable}
                className={`
                  absolute rounded-full flex items-center justify-center
                  text-white font-bold shadow-md
                  transition-all duration-200
                  ${isMovable && !isSelected ? "animate-pulse cursor-pointer ring-2 ring-white z-10" : ""}
                  ${isSelected ? "ring-2 ring-yellow-300 scale-125 z-20 cursor-pointer" : ""}
                  ${!isMovable ? "cursor-default" : ""}
                `}
                style={{
                  left: `calc(${left} + ${offset.dx}%)`,
                  top: `calc(${top} + ${offset.dy}%)`,
                  transform: "translate(-50%, -50%)",
                  width: size,
                  height: size,
                  backgroundColor: PIECE_COLORS[p.color],
                  borderWidth: "2px",
                  borderColor: PIECE_BORDER_COLORS[p.color],
                  fontSize: stacked ? "8px" : "10px",
                }}
              >
                {p.id}
              </button>
            );
          });
        })}
      </div>
    </div>
  );
}
