export interface PlayerRequest {
  name: string;
  isBot: boolean;
}

export interface CreateGameRequest {
  players: PlayerRequest[];
}

export interface PlayerResponse {
  name: string;
  color: string;
  isBot: boolean;
}

export interface PieceResponse {
  id: number;
  color: string;
  currentStep: number;
  state: string;
}

export interface GameStateResponse {
  gameId: string;
  isGameOver: boolean;
  currentPlayerIndex: number;
  currentPlayer: PlayerResponse;
  players: PlayerResponse[];
  pieces: Record<string, PieceResponse[]>;
  lastRoll: number | null;
  winnerName: string | null;
}

export interface MovablePieceResponse {
  pieceId: number;
  currentState: string;
  currentStep: number;
  moveDescription: string;
}

export interface RollDiceResponse {
  value: number;
  bonusTurn: boolean;
  movablePieces: MovablePieceResponse[];
}

export interface MovePieceRequest {
  pieceId: number;
}

export interface MovePieceResponse {
  piece: PieceResponse;
  result: string;
  pieceCaptured: boolean;
  capturedPieceInfo: string | null;
  isGameOver: boolean;
  winnerName: string | null;
}
