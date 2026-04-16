using Ludo.Enums;

namespace Ludo.Api.DTOs;

public record CreateGameRequest(
    List<PlayerRequest> Players
);

public record PlayerRequest(
    string Name,
    bool IsBot
);

public record GameStateResponse(
    string GameId,
    bool IsGameOver,
    int CurrentPlayerIndex,
    PlayerResponse CurrentPlayer,
    List<PlayerResponse> Players,
    Dictionary<string, List<PieceResponse>> Pieces,
    int? LastRoll,
    string? WinnerName
);

public record PlayerResponse(
    string Name,
    string Color,
    bool IsBot
);

public record PieceResponse(
    int Id,
    string Color,
    int CurrentStep,
    string State
);

public record RollDiceResponse(
    int Value,
    bool BonusTurn,
    List<MovablePieceResponse> MovablePieces
);

public record MovablePieceResponse(
    int PieceId,
    string CurrentState,
    int CurrentStep,
    string MoveDescription
);

public record MovePieceRequest(
    int PieceId
);

public record MovePieceResponse(
    PieceResponse Piece,
    string Result,
    bool PieceCaptured,
    string? CapturedPieceInfo,
    bool IsGameOver,
    string? WinnerName
);
