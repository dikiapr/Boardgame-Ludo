"use client";

import { ReactNode } from "react";
import { PlayerResponse } from "@/types/game";

interface GameLogProps {
  messages: string[];
  players?: PlayerResponse[];
}

const playerColorStyle: Record<string, string> = {
  Red: "#C0392B",
  Blue: "#2980B9",
  Green: "#27AE60",
  Yellow: "#D97706",
};

function parseMessage(
  msg: string,
  players: PlayerResponse[]
): { time: string; parts: ReactNode[] } {
  const timeMatch = msg.match(/\[(\d+):(\d+):\d+\s*[AP]M\]/i);
  const time = timeMatch
    ? `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`
    : "";
  const text = msg.replace(/\[.*?\]\s*/, "");

  const occurrences: { start: number; end: number; player: PlayerResponse }[] = [];
  for (const player of players) {
    let idx = text.indexOf(player.name);
    while (idx !== -1) {
      occurrences.push({ start: idx, end: idx + player.name.length, player });
      idx = text.indexOf(player.name, idx + 1);
    }
  }
  occurrences.sort((a, b) => a.start - b.start);

  const parts: ReactNode[] = [];
  let pos = 0;
  let key = 0;

  for (const occ of occurrences) {
    if (occ.start > pos) {
      parts.push(<span key={key++}>{text.slice(pos, occ.start)}</span>);
    }
    parts.push(
      <span
        key={key++}
        style={{ color: playerColorStyle[occ.player.color] ?? "#2C2416", fontWeight: 700 }}
      >
        {occ.player.name}
      </span>
    );
    pos = occ.end;
  }
  if (pos < text.length) {
    parts.push(<span key={key++}>{text.slice(pos)}</span>);
  }

  return {
    time,
    parts: parts.length ? parts : [<span key={0}>{text}</span>],
  };
}

export default function GameLog({ messages, players = [] }: GameLogProps) {
  const reversed = [...messages].reverse();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold" style={{ color: "#5C5246" }}>
        Log Pertandingan
      </h3>
      <div className="space-y-2.5">
        {reversed.length === 0 && (
          <p className="text-sm" style={{ color: "#A8A099" }}>
            Belum ada aktivitas...
          </p>
        )}
        {reversed.map((msg, i) => {
          const { time, parts } = parseMessage(msg, players);
          return (
            <div key={i} className="flex gap-3 items-start">
              <span
                className="shrink-0 text-xs font-mono mt-0.5 w-10"
                style={{ color: "#A8A099" }}
              >
                {time}
              </span>
              <span className="text-sm leading-relaxed" style={{ color: "#5C5246" }}>
                {parts}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
