namespace Ludo.Api.DTOs.Responses;

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
