namespace Ludo.Api.DTOs.Responses;

public record RollDiceResponse(
    int Value,
    bool BonusTurn,
    List<MovablePieceResponse> MovablePieces
);
