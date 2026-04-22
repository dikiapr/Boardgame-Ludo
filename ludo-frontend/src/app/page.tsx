"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { gameApi } from "@/services/api";

interface PlayerSetup {
  name: string;
  isBot: boolean;
}

const colorLabels = ["Red", "Blue", "Green", "Yellow"];
const colorDots = ["#E55353", "#3B82F6", "#22C55E", "#FFD23F"];
const colorBorderStyle = [
  { borderColor: "#E55353", backgroundColor: "#FFF5F5" },
  { borderColor: "#3B82F6", backgroundColor: "#F0F5FF" },
  { borderColor: "#22C55E", backgroundColor: "#F0FFF4" },
  { borderColor: "#FFD23F", backgroundColor: "#FFFBEB" },
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
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#EDE8DC" }}
    >
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold mb-2" style={{ color: "#2C2416" }}>
            🎲 Ludo Game
          </h1>
          <p style={{ color: "#7D766A" }}>Pilih mode permainan dan mulai bermain!</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => selectMode("pvp")}
            className="p-6 rounded-2xl border-2 transition-all text-center"
            style={{
              borderColor: mode === "pvp" ? "#FF9F1C" : "#DDD8CC",
              backgroundColor: mode === "pvp" ? "#FFF8EE" : "#F5F0E6",
              color: "#2C2416",
            }}
          >
            <div className="text-3xl mb-2">👥</div>
            <div className="font-bold">Player vs Player</div>
            <div className="text-xs mt-1" style={{ color: "#7D766A" }}>Main bareng teman</div>
          </button>
          <button
            onClick={() => selectMode("pvb")}
            className="p-6 rounded-2xl border-2 transition-all text-center"
            style={{
              borderColor: mode === "pvb" ? "#FF9F1C" : "#DDD8CC",
              backgroundColor: mode === "pvb" ? "#FFF8EE" : "#F5F0E6",
              color: "#2C2416",
            }}
          >
            <div className="text-3xl mb-2">🤖</div>
            <div className="font-bold">Player vs Bot</div>
            <div className="text-xs mt-1" style={{ color: "#7D766A" }}>Lawan komputer</div>
          </button>
        </div>

        {mode && (
          <>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "#5C5246" }}>
                Jumlah Pemain
              </label>
              <div className="flex gap-2">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => updatePlayerCount(n)}
                    className="flex-1 py-2 rounded-xl border-2 font-bold transition-all"
                    style={{
                      borderColor: playerCount === n ? "#FFD23F" : "#DDD8CC",
                      backgroundColor: playerCount === n ? "#FFD23F" : "#F5F0E6",
                      color: "#2C2416",
                    }}
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
                  className="flex items-center gap-3 p-3 rounded-xl border-2"
                  style={colorBorderStyle[i]}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: colorDots[i] }}
                  />
                  <span className="text-sm font-bold w-14" style={{ color: "#5C5246" }}>
                    {colorLabels[i]}
                  </span>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayer(i, "name", e.target.value)}
                    placeholder={player.isBot ? `Bot ${i + 1}` : `Player ${i + 1}`}
                    className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none border"
                    style={{
                      backgroundColor: "#FAF7F2",
                      borderColor: "#DDD8CC",
                      color: "#2C2416",
                    }}
                  />
                  {mode === "pvb" && (
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={player.isBot}
                        onChange={(e) => updatePlayer(i, "isBot", e.target.checked)}
                        className="w-4 h-4"
                        style={{ accentColor: "#FF9F1C" }}
                      />
                      <span className="text-xs" style={{ color: "#7D766A" }}>Bot</span>
                    </label>
                  )}
                </div>
              ))}
            </div>

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <button
              onClick={handleStart}
              disabled={loading}
              className="w-full py-3 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#FFD23F", color: "#2C2416" }}
            >
              {loading ? "Memulai..." : "Mulai Permainan 🎮"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
