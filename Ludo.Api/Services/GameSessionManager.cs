using System.Collections.Concurrent;
using Ludo.Api.Models;
using Ludo.Controllers;
using Ludo.Models;

namespace Ludo.Api.Services;

public class GameSessionManager : IGameSessionManager
{
    private const int BoardWidth = 15;
    private const int BoardHeight = 15;
    private const int GameIdLength = 8;

    private readonly ConcurrentDictionary<string, GameSession> _sessions = new();

    public GameSession CreateGame(IList<string> playerNames, IList<bool> isBotList)
    {
        var gameId = Guid.NewGuid().ToString("N")[..GameIdLength];
        var dice = new Dice();
        var board = new Board(BoardWidth, BoardHeight);
        var controller = new GameController(dice, board, playerNames, isBotList);
        controller.StartGame();

        var session = new GameSession(gameId, controller);
        _sessions[gameId] = session;
        return session;
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
