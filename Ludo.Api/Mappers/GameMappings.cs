using Ludo.Api.DTOs.Responses;
using Ludo.Api.Models;
using Ludo.Interfaces;

namespace Ludo.Api.Mappers;

public static class GameMappings
{
    public static PlayerResponse ToResponse(this IPlayer player)
        => new(player.Name, player.Color.ToString(), player.IsBot);

    public static PieceResponse ToResponse(this IPiece piece)
        => new(piece.Id, piece.Color.ToString(), piece.CurrentStep, piece.State.ToString());

    public static GameStateResponse ToStateResponse(this GameSession session)
    {
        var ctrl = session.Controller;
        var players = ctrl.GetPlayers();
        var allPieces = ctrl.GetAllPieces();
        var current = ctrl.GetCurrentPlayer();

        return new GameStateResponse(
            session.Id,
            ctrl.IsGameOver,
            ctrl.CurrentPlayerIndex,
            current.ToResponse(),
            players.Select(p => p.ToResponse()).ToList(),
            allPieces.ToDictionary(
                kvp => kvp.Key.ToString(),
                kvp => kvp.Value.Select(p => p.ToResponse()).ToList()
            ),
            session.LastRoll,
            session.WinnerName
        );
    }
}
