"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { gameApi } from "@/services/api";
import {
  GameStateResponse,
  MovablePieceResponse,
} from "@/types/game";
import Dice from "@/components/Dice";
import PlayerPanel from "@/components/PlayerPanel";
import MovablePiecesList from "@/components/MovablePiecesList";
import GameLog from "@/components/GameLog";

type Phase = "waiting" | "rolling" | "rolled" | "choosing" | "moving" | "bot-turn" | "game-over";

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

  // Load game state
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
    }, 1200);

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
        // Auto select single piece
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
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🎲 Ludo Game</h1>
            <p className="text-xs text-gray-500">Game ID: {gameId}</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 text-sm bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Menu
          </button>
        </div>

        {/* Game Over Banner */}
        {gameState.isGameOver && gameState.winnerName && (
          <div className="bg-gradient-to-r from-yellow-600 to-amber-600 rounded-xl p-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">🏆 Game Over!</h2>
            <p className="text-xl text-white">
              Pemenang: <strong>{gameState.winnerName}</strong>
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-6 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-100"
            >
              Main Lagi
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Player Panels */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gameState.players.map((player, i) => (
                <PlayerPanel
                  key={i}
                  player={player}
                  pieces={gameState.pieces[player.color] || []}
                  isCurrentTurn={i === gameState.currentPlayerIndex && !gameState.isGameOver}
                  movablePieceIds={
                    i === gameState.currentPlayerIndex && phase === "choosing"
                      ? movablePieces.map((p) => p.pieceId)
                      : []
                  }
                  selectedPieceId={
                    i === gameState.currentPlayerIndex ? selectedPieceId : null
                  }
                  onPieceSelect={(id) => {
                    if (phase === "choosing") setSelectedPieceId(id);
                  }}
                />
              ))}
            </div>

            {/* Game Log */}
            <GameLog messages={log} />
          </div>

          {/* Right: Controls */}
          <div className="space-y-4">
            {/* Current Turn Info */}
            {!gameState.isGameOver && (
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-400 mb-1">Giliran</p>
                <p className="text-lg font-bold">
                  {gameState.currentPlayer.name}
                  {gameState.currentPlayer.isBot && (
                    <span className="text-xs ml-2 bg-gray-700 px-2 py-0.5 rounded-full">BOT</span>
                  )}
                </p>
              </div>
            )}

            {/* Dice */}
            {!gameState.isGameOver && (
              <div className="bg-gray-800/50 rounded-xl p-6 flex justify-center">
                <Dice
                  value={diceValue}
                  rolling={rolling}
                  onRoll={handleRoll}
                  disabled={!canRoll}
                />
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
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <p className="text-gray-400 animate-pulse">🤖 Bot sedang berpikir...</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
