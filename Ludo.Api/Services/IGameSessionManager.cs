using Ludo.Api.Models;

namespace Ludo.Api.Services;

public interface IGameSessionManager
{
    GameSession CreateGame(IList<string> playerNames, IList<bool> isBotList);
    GameSession? GetSession(string gameId);
    bool RemoveSession(string gameId);
}
