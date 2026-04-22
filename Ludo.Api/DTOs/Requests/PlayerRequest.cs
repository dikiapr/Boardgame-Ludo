namespace Ludo.Api.DTOs.Requests;

public record PlayerRequest(
    string Name,
    bool IsBot
);
