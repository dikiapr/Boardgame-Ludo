"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { gameApi } from "@/services/api";
import {
  GameStateResponse,
  MovablePieceResponse,
  MovePieceResponse,
} from "@/types/game";
import Dice from "@/components/Dice";
import MovablePiecesList from "@/components/MovablePiecesList";
import GameLog from "@/components/GameLog";
import LudoBoard, { buildMovePath, AnimatingPiece } from "@/components/LudoBoard";

type Phase = "waiting" | "rolling" | "rolled" | "choosing" | "moving" | "bot-turn" | "game-over";

const tabIconColor: Record<string, string> = {
  Red: "#E55353",
  Blue: "#3B82F6",
  Green: "#22C55E",
  Yellow: "#FFD23F",
};

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const [gameState, setGameState] = useState<GameStateResponse | null>(null);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [movablePieces, setMovablePieces] = useState<MovablePieceResponse[]>([]);
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [animatingPiece, setAnimatingPiece] = useState<AnimatingPiece | null>(null);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const loadGame = useCallback(async () => {
    try {
      const state = await gameApi.getGameState(gameId);
      setGameState(state);

      if (state.isGameOver) {
        setPhase("game-over");
        return;
      }

      if (state.currentPlayer.isBot) {
        setPhase("bot-turn");
      } else {
        setPhase("waiting");
      }
    } catch {
      setError("Gagal memuat game. Game mungkin tidak ditemukan.");
    }
  }, [gameId]);

  useEffect(() => {
    loadGame();
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, [loadGame]);

  // Animate a piece along a path, then call onDone
  const animatePath = useCallback(
    (color: string, id: number, path: [number, number][], onDone: () => void) => {
      if (path.length <= 1) {
        onDone();
        return;
      }
      let stepIdx = 0;
      setAnimatingPiece({ color, id, currentPos: path[0] });

      const tick = () => {
        stepIdx++;
        if (stepIdx >= path.length) {
          setAnimatingPiece(null);
          onDone();
          return;
        }
        setAnimatingPiece({ color, id, currentPos: path[stepIdx] });
        animTimerRef.current = setTimeout(tick, 150);
      };
      animTimerRef.current = setTimeout(tick, 150);
    },
    [],
  );

  // Auto bot turn
  useEffect(() => {
    if (phase !== "bot-turn" || !gameState || gameState.isGameOver) return;

    botTimerRef.current = setTimeout(async () => {
      try {
        // Capture old piece states before bot moves
        const botColor = gameState.currentPlayer.color;
        const oldPieces = gameState.pieces[botColor] ?? [];

        const result = await gameApi.botMove(gameId);
        addLog(result.result);

        if (result.pieceCaptured && result.capturedPieceInfo) {
          addLog(`⚔️ ${result.capturedPieceInfo}`);
        }

        if (result.isGameOver && result.winnerName) {
          addLog(`🏆 ${result.winnerName} menang!`);
        }

        // Animate the bot's moved piece
        const movedPiece = result.piece;
        const oldInfo = oldPieces.find((p) => p.id === movedPiece.id);
        const oldStep = oldInfo?.currentStep ?? 0;
        const oldState = oldInfo?.state ?? "Base";
        const path = buildMovePath(botColor, movedPiece.id, oldStep, movedPiece.currentStep, oldState, movedPiece.state);

        if (path.length > 1) {
          animatePath(botColor, movedPiece.id, path, () => {
            loadGame();
          });
        } else {
          await loadGame();
        }
      } catch {
        addLog("Bot gagal bergerak.");
        await loadGame();
      }
    }, 1500);

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [phase, gameState, gameId, addLog, loadGame]);

  const handleRoll = async () => {
    setRolling(true);
    setError("");
    setSelectedPieceId(null);

    try {
      const [result] = await Promise.all([
        gameApi.rollDice(gameId),
        new Promise<void>((resolve) => setTimeout(resolve, 1500)),
      ]);
      setDiceValue(result.value);
      setMovablePieces(result.movablePieces);

      addLog(
        `${gameState?.currentPlayer.name} melempar dadu: ${result.value}${
          result.bonusTurn ? " (bonus giliran!)" : ""
        }`
      );

      if (result.movablePieces.length === 0) {
        addLog("Tidak ada pion yang bisa bergerak. Giliran dilewati.");
        setPhase("rolled");
        setTimeout(() => loadGame(), 1000);
      } else if (result.movablePieces.length === 1) {
        setSelectedPieceId(result.movablePieces[0].pieceId);
        setPhase("choosing");
      } else {
        setPhase("choosing");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal melempar dadu.");
    } finally {
      setRolling(false);
    }
  };

  const handleMovePiece = async (directPieceId?: number) => {
    const pieceId = directPieceId ?? selectedPieceId;
    if (pieceId === null) return;
    setPhase("moving");
    setError("");

    // Find the piece's current state before the move
    const movableInfo = movablePieces.find((p) => p.pieceId === pieceId);
    const color = gameState?.currentPlayer.color ?? "";
    const oldStep = movableInfo?.currentStep ?? 0;
    const oldState = movableInfo?.currentState ?? "Base";

    try {
      const result = await gameApi.movePiece(gameId, { pieceId });
      addLog(result.result);

      if (result.pieceCaptured && result.capturedPieceInfo) {
        addLog(`⚔️ ${result.capturedPieceInfo}`);
      }

      if (result.isGameOver && result.winnerName) {
        addLog(`🏆 ${result.winnerName} menang!`);
      }

      // Build path and animate
      const newStep = result.piece.currentStep;
      const newState = result.piece.state;
      const path = buildMovePath(color, pieceId, oldStep, newStep, oldState, newState);

      setMovablePieces([]);
      setSelectedPieceId(null);
      setDiceValue(null);

      if (path.length > 1) {
        animatePath(color, pieceId, path, () => {
          loadGame();
        });
      } else {
        await loadGame();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menggerakkan pion.");
      setPhase("choosing");
    }
  };

  if (error && !gameState) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-4" style={{ backgroundColor: "#EDE8DC" }}>
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2 rounded-xl font-semibold"
          style={{ backgroundColor: "#F5F0E6", color: "#2C2416" }}
        >
          Kembali ke Menu
        </button>
      </main>
    );
  }

  if (!gameState) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#EDE8DC" }}>
        <p className="text-lg" style={{ color: "#7D766A" }}>Memuat game...</p>
      </main>
    );
  }

  const isHumanTurn = !gameState.currentPlayer.isBot && !gameState.isGameOver;
  const canRoll = isHumanTurn && phase === "waiting";

  return (
    <main className="h-screen overflow-hidden flex flex-col p-3" style={{ backgroundColor: "#EDE8DC" }}>
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#2C2416" }}>🎲 Ludo Game</h1>
          <p className="text-[10px]" style={{ color: "#2C2416" }}>ID: {gameId}</p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="px-3 py-1.5 text-sm rounded-lg transition-colors font-semibold"
          style={{ backgroundColor: "#F5F0E6", color: "#5C5246" }}
        >
          ← Menu
        </button>
      </div>

      {/* Game Over Banner */}
      {gameState.isGameOver && gameState.winnerName && (
        <div className="bg-gradient-to-r from-yellow-600 to-amber-600 rounded-xl p-4 text-center shrink-0 mb-2">
          <h2 className="text-2xl font-bold text-white mb-1">🏆 Game Over!</h2>
          <p className="text-lg text-white">
            Pemenang: <strong>{gameState.winnerName}</strong>
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-2 px-6 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-100"
          >
            Main Lagi
          </button>
        </div>
      )}

      {/* Main Content: Board (left) + Controls (right) — always side-by-side */}
      <div className="flex-1 min-h-0 flex gap-4">
        {/* Left: Board */}
        <div className="shrink-0 h-full flex items-center">
          <div className="h-full aspect-square">
            <LudoBoard
              pieces={gameState.pieces}
              movablePieceIds={
                phase === "choosing"
                  ? movablePieces.map((p) => p.pieceId)
                  : []
              }
              selectedPieceId={selectedPieceId}
              currentPlayerColor={gameState.currentPlayer.color}
              onPieceSelect={(id) => {
                if (phase === "choosing") handleMovePiece(id);
              }}
              animatingPiece={animatingPiece}
            />
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-y-auto">
          {/* Player Tabs */}
          <div className="grid grid-cols-4 gap-2 shrink-0">
            {gameState.players.map((player, i) => {
              const isCurrent =
                i === gameState.currentPlayerIndex && !gameState.isGameOver;
              const color = tabIconColor[player.color] ?? "#9ca3af";
              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all"
                  style={{
                    border: isCurrent ? `2px solid ${color}` : "2px solid #DDD8CC",
                    backgroundColor: isCurrent ? `${color}20` : "#F5F0E6",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6"
                    style={{ color: isCurrent ? color : "#B5AFA8" }}
                  >
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: isCurrent ? color : "#A8A099" }}
                  >
                    P{i + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Current Turn + Dice */}
          {!gameState.isGameOver && (
            <div className="shrink-0 space-y-4">
              <p className="text-center text-sm" style={{ color: "#7D766A" }}>
                Giliran{" "}
                <span className="font-bold" style={{ color: "#2C2416" }}>
                  {gameState.currentPlayer.name}
                </span>
                {gameState.currentPlayer.isBot && (
                  <span
                    className="ml-2 text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "#E8E2D6", color: "#7D766A" }}
                  >
                    BOT
                  </span>
                )}
              </p>
              <Dice
                value={diceValue}
                rolling={rolling}
                onRoll={handleRoll}
                disabled={!canRoll}
              />
            </div>
          )}

          {/* All Pieces List */}
          {!gameState.isGameOver && (
            <MovablePiecesList
              allPieces={gameState.pieces[gameState.currentPlayer.color] ?? []}
              movablePieces={phase === "choosing" ? movablePieces : []}
              diceValue={phase === "choosing" ? diceValue : null}
              onSelect={(id) => handleMovePiece(id)}
            />
          )}

          {/* Bot Turn Indicator */}
          {phase === "bot-turn" && (
            <div className="rounded-xl p-3 text-center shrink-0" style={{ backgroundColor: "#F5F0E6" }}>
              <p className="animate-pulse" style={{ color: "#7D766A" }}>
                🤖 Bot sedang berpikir...
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-600 text-sm text-center shrink-0">{error}</p>
          )}

          {/* Game Log - fills remaining space */}
          <div className="flex-1 min-h-[100px]">
            <GameLog messages={log} players={gameState.players} />
          </div>
        </div>
      </div>
    </main>
  );
}
