namespace Ludo.Api.DTOs.Responses;

public record MovePieceResponse(
    PieceResponse? Piece,
    string Result,
    bool PieceCaptured,
    string? CapturedPieceInfo,
    bool IsGameOver,
    string? WinnerName
);
