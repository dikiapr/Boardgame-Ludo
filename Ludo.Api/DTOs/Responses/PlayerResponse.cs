namespace Ludo.Api.DTOs.Responses;

public record PlayerResponse(
    string Name,
    string Color,
    bool IsBot
);
