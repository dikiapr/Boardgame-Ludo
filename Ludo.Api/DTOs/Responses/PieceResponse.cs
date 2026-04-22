namespace Ludo.Api.DTOs.Responses;

public record PieceResponse(
    int Id,
    string Color,
    int CurrentStep,
    string State
);
