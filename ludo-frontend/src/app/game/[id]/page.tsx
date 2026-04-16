"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { gameApi } from "@/services/api";
import {
  GameStateResponse,
  MovablePieceResponse,
} from "@/types/game";
import Dice from "@/components/Dice";
import MovablePiecesList from "@/components/MovablePiecesList";
import GameLog from "@/components/GameLog";
import LudoBoard from "@/components/LudoBoard";

type Phase = "waiting" | "rolling" | "rolled" | "choosing" | "moving" | "bot-turn" | "game-over";

const borderColor: Record<string, string> = {
  Red: "border-red-500", Blue: "border-blue-500", Green: "border-green-500", Yellow: "border-yellow-400",
};
const bgColor: Record<string, string> = {
  Red: "bg-red-500/10", Blue: "bg-blue-500/10", Green: "bg-green-500/10", Yellow: "bg-yellow-400/10",
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
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    };
  }, [loadGame]);

  // Auto bot turn
  useEffect(() => {
    if (phase !== "bot-turn" || !gameState || gameState.isGameOver) return;

    botTimerRef.current = setTimeout(async () => {
      try {
        const result = await gameApi.botMove(gameId);
        addLog(result.result);

        if (result.pieceCaptured && result.capturedPieceInfo) {
          addLog(`⚔️ ${result.capturedPieceInfo}`);
        }

        if (result.isGameOver && result.winnerName) {
          addLog(`🏆 ${result.winnerName} menang!`);
        }

        await loadGame();
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
      const result = await gameApi.rollDice(gameId);
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

  const handleMovePiece = async () => {
    if (selectedPieceId === null) return;
    setPhase("moving");
    setError("");

    try {
      const result = await gameApi.movePiece(gameId, { pieceId: selectedPieceId });
      addLog(result.result);

      if (result.pieceCaptured && result.capturedPieceInfo) {
        addLog(`⚔️ ${result.capturedPieceInfo}`);
      }

      if (result.isGameOver && result.winnerName) {
        addLog(`🏆 ${result.winnerName} menang!`);
      }

      setMovablePieces([]);
      setSelectedPieceId(null);
      setDiceValue(null);
      await loadGame();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menggerakkan pion.");
      setPhase("choosing");
    }
  };

  if (error && !gameState) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-red-400 text-lg">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
        >
          Kembali ke Menu
        </button>
      </main>
    );
  }

  if (!gameState) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-lg">Memuat game...</p>
      </main>
    );
  }

  const isHumanTurn = !gameState.currentPlayer.isBot && !gameState.isGameOver;
  const canRoll = isHumanTurn && phase === "waiting";

  return (
    <main className="h-screen overflow-hidden flex flex-col p-3">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-2">
        <div>
          <h1 className="text-xl font-bold">🎲 Ludo Game</h1>
          <p className="text-[10px] text-gray-500">ID: {gameId}</p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="px-3 py-1.5 text-sm bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
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
                if (phase === "choosing") setSelectedPieceId(id);
              }}
            />
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-y-auto">
          {/* Player Info Cards */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            {gameState.players.map((player, i) => {
              const isCurrent =
                i === gameState.currentPlayerIndex && !gameState.isGameOver;
              const finishedCount =
                gameState.pieces[player.color]?.filter(
                  (p) => p.state === "Finished"
                ).length ?? 0;

              return (
                <div
                  key={i}
                  className={`p-2 rounded-lg border-2 text-center transition-all
                    ${borderColor[player.color]} ${bgColor[player.color]}
                    ${isCurrent ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-black" : "opacity-60"}`}
                >
                  <div className="font-semibold text-sm truncate">
                    {player.name}
                    {player.isBot && (
                      <span className="ml-1 text-[10px] bg-gray-700 text-white px-1 rounded">
                        BOT
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {finishedCount}/4 selesai
                  </div>
                  {isCurrent && (
                    <div className="text-[10px] text-yellow-400 font-bold mt-0.5">
                      ▶ GILIRAN
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Turn + Dice */}
          {!gameState.isGameOver && (
            <div className="shrink-0 space-y-3">
              <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400">Giliran</p>
                <p className="text-base font-bold">
                  {gameState.currentPlayer.name}
                  {gameState.currentPlayer.isBot && (
                    <span className="text-xs ml-2 bg-gray-700 px-2 py-0.5 rounded-full">
                      BOT
                    </span>
                  )}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3 flex justify-center">
                <Dice
                  value={diceValue}
                  rolling={rolling}
                  onRoll={handleRoll}
                  disabled={!canRoll}
                />
              </div>
            </div>
          )}

          {/* Movable Pieces Selection */}
          {phase === "choosing" && movablePieces.length > 0 && (
            <MovablePiecesList
              pieces={movablePieces}
              selectedPieceId={selectedPieceId}
              onSelect={setSelectedPieceId}
              onConfirm={handleMovePiece}
            />
          )}

          {/* Bot Turn Indicator */}
          {phase === "bot-turn" && (
            <div className="bg-gray-800/50 rounded-xl p-3 text-center shrink-0">
              <p className="text-gray-400 animate-pulse">
                🤖 Bot sedang berpikir...
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm text-center shrink-0">{error}</p>
          )}

          {/* Game Log - fills remaining space */}
          <div className="flex-1 min-h-[100px]">
            <GameLog messages={log} />
          </div>
        </div>
      </div>
    </main>
  );
}
