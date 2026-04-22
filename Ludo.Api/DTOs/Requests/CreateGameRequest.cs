namespace Ludo.Api.DTOs.Requests;

public record CreateGameRequest(
    List<PlayerRequest> Players
);
