import {
  CreateGameRequest,
  GameStateResponse,
  RollDiceResponse,
  MovePieceRequest,
  MovePieceResponse,
} from "@/types/game";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5029";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const gameApi = {
  createGame(data: CreateGameRequest): Promise<GameStateResponse> {
    return request("/api/game/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getGameState(gameId: string): Promise<GameStateResponse> {
    return request(`/api/game/${gameId}`);
  },

  rollDice(gameId: string): Promise<RollDiceResponse> {
    return request(`/api/game/${gameId}/roll`, { method: "POST" });
  },

  movePiece(
    gameId: string,
    data: MovePieceRequest,
  ): Promise<MovePieceResponse> {
    return request(`/api/game/${gameId}/move`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  botMove(gameId: string): Promise<MovePieceResponse> {
    return request(`/api/game/${gameId}/bot-move`, { method: "POST" });
  },

  // deleteGame(gameId: string): Promise<void> {
  //   return request(`/api/game/${gameId}`, { method: "DELETE" });
  // },
};
