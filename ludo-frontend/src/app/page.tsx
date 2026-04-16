"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { gameApi } from "@/services/api";

interface PlayerSetup {
  name: string;
  isBot: boolean;
}

const colorLabels = ["Red", "Blue", "Green", "Yellow"];
const colorClasses = [
  "border-red-500 bg-red-500/10",
  "border-blue-500 bg-blue-500/10",
  "border-green-500 bg-green-500/10",
  "border-yellow-400 bg-yellow-400/10",
];

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"pvp" | "pvb" | null>(null);
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState<PlayerSetup[]>([
    { name: "", isBot: false },
    { name: "", isBot: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updatePlayerCount = (count: number) => {
    setPlayerCount(count);
    const newPlayers: PlayerSetup[] = [];
    for (let i = 0; i < count; i++) {
      newPlayers.push(players[i] || { name: "", isBot: mode === "pvb" && i >= 1 });
    }
    setPlayers(newPlayers);
  };

  const updatePlayer = (index: number, field: keyof PlayerSetup, value: string | boolean) => {
    const updated = [...players];
    updated[index] = { ...updated[index], [field]: value };
    setPlayers(updated);
  };

  const selectMode = (m: "pvp" | "pvb") => {
    setMode(m);
    if (m === "pvp") {
      setPlayers(players.map((p) => ({ ...p, isBot: false })));
    } else {
      const updated = [...players];
      if (updated.length >= 2) {
        updated[updated.length - 1] = { ...updated[updated.length - 1], isBot: true };
      }
      setPlayers(updated);
    }
  };

  const handleStart = async () => {
    const hasHuman = players.some((p) => !p.isBot);
    if (!hasHuman) {
      setError("Minimal harus ada 1 pemain manusia.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await gameApi.createGame({
        players: players.map((p, i) => ({
          name: p.name.trim() || (p.isBot ? `Bot ${i + 1}` : `Player ${i + 1}`),
          isBot: p.isBot,
        })),
      });
      router.push(`/game/${data.gameId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat game.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-2">🎲 Ludo Game</h1>
          <p className="text-gray-400">Pilih mode permainan dan mulai bermain!</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => selectMode("pvp")}
            className={`p-6 rounded-xl border-2 transition-all text-center
              ${mode === "pvp" ? "border-blue-500 bg-blue-500/20" : "border-gray-700 hover:border-gray-500"}`}
          >
            <div className="text-3xl mb-2">👥</div>
            <div className="font-bold">Player vs Player</div>
            <div className="text-xs text-gray-400 mt-1">Main bareng teman</div>
          </button>
          <button
            onClick={() => selectMode("pvb")}
            className={`p-6 rounded-xl border-2 transition-all text-center
              ${mode === "pvb" ? "border-green-500 bg-green-500/20" : "border-gray-700 hover:border-gray-500"}`}
          >
            <div className="text-3xl mb-2">🤖</div>
            <div className="font-bold">Player vs Bot</div>
            <div className="text-xs text-gray-400 mt-1">Lawan komputer</div>
          </button>
        </div>

        {mode && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Jumlah Pemain
              </label>
              <div className="flex gap-2">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => updatePlayerCount(n)}
                    className={`flex-1 py-2 rounded-lg border-2 font-bold transition-all
                      ${playerCount === n ? "border-white bg-white/10" : "border-gray-700 hover:border-gray-500"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {players.map((player, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 ${colorClasses[i]}`}
                >
                  <span className="text-sm font-bold w-14 text-gray-300">{colorLabels[i]}</span>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayer(i, "name", e.target.value)}
                    placeholder={player.isBot ? `Bot ${i + 1}` : `Player ${i + 1}`}
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2
                               text-sm placeholder-gray-500 focus:outline-none focus:border-gray-400"
                  />
                  {mode === "pvb" && (
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={player.isBot}
                        onChange={(e) => updatePlayer(i, "isBot", e.target.checked)}
                        className="w-4 h-4 accent-green-500"
                      />
                      <span className="text-xs text-gray-400">Bot</span>
                    </label>
                  )}
                </div>
              ))}
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              onClick={handleStart}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white
                         rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Memulai..." : "Mulai Permainan 🎮"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
