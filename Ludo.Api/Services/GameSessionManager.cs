using System.Collections.Concurrent;
using Ludo.Controllers;
using Ludo.Enums;
using Ludo.Interfaces;
using Ludo.Models;

namespace Ludo.Api.Services;

public class GameSessionManager
{
    private readonly ConcurrentDictionary<string, GameSession> _sessions = new();

    public (string gameId, GameSession session) CreateGame(List<string> playerNames, List<bool> isBotList)
    {
        var gameId = Guid.NewGuid().ToString("N")[..8];
        var dice = new Dice();
        var board = new Board(15, 15);
        var controller = new GameController(dice, board, playerNames, isBotList);
        controller.StartGame();

        var session = new GameSession(controller);
        _sessions[gameId] = session;
        return (gameId, session);
    }

    public GameSession? GetSession(string gameId)
    {
        _sessions.TryGetValue(gameId, out var session);
        return session;
    }

    public bool RemoveSession(string gameId)
    {
        return _sessions.TryRemove(gameId, out _);
    }
}

public class GameSession
{
    public GameController Controller { get; }
    public int? LastRoll { get; set; }
    public IList<IPiece>? LastMovablePieces { get; set; }
    public bool PieceCapturedThisTurn { get; set; }
    public string? CapturedPieceInfo { get; set; }
    public string? WinnerName { get; set; }

    public GameSession(GameController controller)
    {
        Controller = controller;

        controller.OnPieceCaptured += (attacker, captured) =>
        {
            PieceCapturedThisTurn = true;
            CapturedPieceInfo = $"{attacker} menangkap {captured}! Kembali ke base!";
        };

        controller.OnGameFinished += () =>
        {
            var players = controller.GetPlayers();
            var pieces = controller.GetAllPieces();
            foreach (var player in players)
            {
                if (pieces[player.Color].All(p => p.State == PieceState.Finished))
                {
                    WinnerName = player.Name;
                    break;
                }
            }
        };
    }
}
