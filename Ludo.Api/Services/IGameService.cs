using Ludo.Api.Common;
using Ludo.Api.DTOs.Requests;
using Ludo.Api.DTOs.Responses;

namespace Ludo.Api.Services;

public interface IGameService
{
    OperationResult<GameStateResponse> CreateGame(CreateGameRequest request);
    OperationResult<GameStateResponse> GetGameState(string gameId);
    OperationResult<RollDiceResponse> RollDice(string gameId);
    OperationResult<MovePieceResponse> MovePiece(string gameId, MovePieceRequest request);
    OperationResult<MovePieceResponse> BotMove(string gameId);
    OperationResult<bool> DeleteGame(string gameId);
}
