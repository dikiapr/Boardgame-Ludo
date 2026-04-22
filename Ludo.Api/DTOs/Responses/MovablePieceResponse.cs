namespace Ludo.Api.DTOs.Responses;

public record MovablePieceResponse(
    int PieceId,
    string CurrentState,
    int CurrentStep,
    string MoveDescription
);
