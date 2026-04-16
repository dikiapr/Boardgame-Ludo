"use client";

interface GameLogProps {
  messages: string[];
}

export default function GameLog({ messages }: GameLogProps) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 h-full min-h-[120px] max-h-full overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-400 mb-2">Game Log</h3>
      <div className="space-y-1">
        {messages.length === 0 && (
          <p className="text-gray-600 text-sm">Belum ada aktivitas...</p>
        )}
        {messages.map((msg, i) => (
          <p key={i} className="text-xs text-gray-300 font-mono">
            {msg}
          </p>
        ))}
      </div>
    </div>
  );
}
