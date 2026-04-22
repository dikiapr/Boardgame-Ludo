using Ludo.Api.Common;
using Ludo.Api.DTOs.Requests;
using Ludo.Api.DTOs.Responses;
using Ludo.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ludo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameController : ControllerBase
{
    private readonly IGameService _gameService;

    public GameController(IGameService gameService)
    {
        _gameService = gameService;
    }

    [HttpPost("create")]
    public ActionResult<GameStateResponse> CreateGame([FromBody] CreateGameRequest request)
        => _gameService.CreateGame(request).ToActionResult();

    [HttpGet("{gameId}")]
    public ActionResult<GameStateResponse> GetGameState(string gameId)
        => _gameService.GetGameState(gameId).ToActionResult();

    [HttpPost("{gameId}/roll")]
    public ActionResult<RollDiceResponse> RollDice(string gameId)
        => _gameService.RollDice(gameId).ToActionResult();

    [HttpPost("{gameId}/move")]
    public ActionResult<MovePieceResponse> MovePiece(string gameId, [FromBody] MovePieceRequest request)
        => _gameService.MovePiece(gameId, request).ToActionResult();

    [HttpPost("{gameId}/bot-move")]
    public ActionResult<MovePieceResponse> BotMove(string gameId)
        => _gameService.BotMove(gameId).ToActionResult();

    [HttpDelete("{gameId}")]
    public IActionResult DeleteGame(string gameId)
    {
        var result = _gameService.DeleteGame(gameId);
        if (!result.IsSuccess)
            return NotFound(result.Error);

        return Ok(new { message = "Game dihapus." });
    }
}
