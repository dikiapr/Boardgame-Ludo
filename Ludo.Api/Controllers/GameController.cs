using Ludo.Api.DTOs;
using Ludo.Api.Services;
using Ludo.Enums;
using Ludo.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Ludo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameController : ControllerBase
{
    private readonly GameSessionManager _sessionManager;

    public GameController(GameSessionManager sessionManager)
    {
        _sessionManager = sessionManager;
    }

    [HttpPost("create")]
    public ActionResult<GameStateResponse> CreateGame([FromBody] CreateGameRequest request)
    {
        if (request.Players.Count < 2 || request.Players.Count > 4)
            return BadRequest("Jumlah pemain harus antara 2 dan 4.");

        if (request.Players.All(p => p.IsBot))
            return BadRequest("Minimal harus ada 1 pemain manusia.");

        var names = request.Players.Select(p => p.Name).ToList();
        var bots = request.Players.Select(p => p.IsBot).ToList();

        var (gameId, session) = _sessionManager.CreateGame(names, bots);
        return Ok(BuildGameState(gameId, session));
    }

    [HttpGet("{gameId}")]
    public ActionResult<GameStateResponse> GetGameState(string gameId)
    {
        var session = _sessionManager.GetSession(gameId);
        if (session == null) return NotFound("Game tidak ditemukan.");

        return Ok(BuildGameState(gameId, session));
    }

    [HttpPost("{gameId}/roll")]
    public ActionResult<RollDiceResponse> RollDice(string gameId)
    {
        var session = _sessionManager.GetSession(gameId);
        if (session == null) return NotFound("Game tidak ditemukan.");

        var controller = session.Controller;
        if (controller.IsGameOver)
            return BadRequest("Game sudah selesai.");

        session.PieceCapturedThisTurn = false;
        session.CapturedPieceInfo = null;

        int roll = controller.RollDice();
        session.LastRoll = roll;

        var movablePieces = controller.GetMovablePieces();
        session.LastMovablePieces = movablePieces;

        if (movablePieces.Count == 0)
        {
            controller.NextTurn();
        }

        var movableResponses = movablePieces.Select(p =>
        {
            string desc = p.State == PieceState.Base
                ? "BASE -> Masuk papan"
                : $"Langkah {p.CurrentStep} -> {p.CurrentStep + roll}";

            return new MovablePieceResponse(
                p.Id,
                p.State.ToString(),
                p.CurrentStep,
                desc
            );
        }).ToList();

        return Ok(new RollDiceResponse(roll, roll == 6, movableResponses));
    }

    [HttpPost("{gameId}/move")]
    public ActionResult<MovePieceResponse> MovePiece(string gameId, [FromBody] MovePieceRequest request)
    {
        var session = _sessionManager.GetSession(gameId);
        if (session == null) return NotFound("Game tidak ditemukan.");

        var controller = session.Controller;
        if (controller.IsGameOver)
            return BadRequest("Game sudah selesai.");

        if (session.LastMovablePieces == null || session.LastRoll == null)
            return BadRequest("Lempar dadu terlebih dahulu.");

        var piece = session.LastMovablePieces.FirstOrDefault(p => p.Id == request.PieceId);
        if (piece == null)
            return BadRequest($"Pion {request.PieceId} tidak bisa bergerak saat ini.");

        var currentPlayer = controller.GetCurrentPlayer();
        var prevState = piece.State;

        session.PieceCapturedThisTurn = false;
        session.CapturedPieceInfo = null;

        controller.MovePiece(currentPlayer, piece, session.LastRoll.Value);

        string result;
        if (prevState == PieceState.Base && piece.State == PieceState.Active)
            result = $"Pion {piece.Id} masuk ke papan!";
        else if (piece.State == PieceState.Finished)
            result = $"Pion {piece.Id} sampai di FINISH!";
        else
        {
            string zone = piece.CurrentStep > 51 ? " (Home Stretch)" : "";
            result = $"Pion {piece.Id} bergerak ke langkah {piece.CurrentStep}{zone}";
        }

        controller.NextTurn();
        session.LastMovablePieces = null;
        session.LastRoll = null;

        return Ok(new MovePieceResponse(
            MapPiece(piece),
            result,
            session.PieceCapturedThisTurn,
            session.CapturedPieceInfo,
            controller.IsGameOver,
            session.WinnerName
        ));
    }

    [HttpPost("{gameId}/bot-move")]
    public ActionResult<MovePieceResponse> BotMove(string gameId)
    {
        var session = _sessionManager.GetSession(gameId);
        if (session == null) return NotFound("Game tidak ditemukan.");

        var controller = session.Controller;
        if (controller.IsGameOver)
            return BadRequest("Game sudah selesai.");

        var currentPlayer = controller.GetCurrentPlayer();
        if (!currentPlayer.IsBot)
            return BadRequest("Giliran saat ini bukan bot.");

        session.PieceCapturedThisTurn = false;
        session.CapturedPieceInfo = null;

        int roll = controller.RollDice();
        session.LastRoll = roll;

        var movablePieces = controller.GetMovablePieces();

        if (movablePieces.Count == 0)
        {
            controller.NextTurn();
            return Ok(new MovePieceResponse(
                null!,
                $"Bot melempar {roll}. Tidak ada pion yang bisa bergerak.",
                false,
                null,
                controller.IsGameOver,
                session.WinnerName
            ));
        }

        var chosen = controller.BotChoosePiece(movablePieces);
        var prevState = chosen.State;

        controller.MovePiece(currentPlayer, chosen, roll);

        string result;
        if (prevState == PieceState.Base && chosen.State == PieceState.Active)
            result = $"Bot melempar {roll}. Pion {chosen.Id} masuk ke papan!";
        else if (chosen.State == PieceState.Finished)
            result = $"Bot melempar {roll}. Pion {chosen.Id} sampai di FINISH!";
        else
        {
            string zone = chosen.CurrentStep > 51 ? " (Home Stretch)" : "";
            result = $"Bot melempar {roll}. Pion {chosen.Id} bergerak ke langkah {chosen.CurrentStep}{zone}";
        }

        controller.NextTurn();
        session.LastMovablePieces = null;
        session.LastRoll = null;

        return Ok(new MovePieceResponse(
            MapPiece(chosen),
            result,
            session.PieceCapturedThisTurn,
            session.CapturedPieceInfo,
            controller.IsGameOver,
            session.WinnerName
        ));
    }

    [HttpDelete("{gameId}")]
    public ActionResult DeleteGame(string gameId)
    {
        if (!_sessionManager.RemoveSession(gameId))
            return NotFound("Game tidak ditemukan.");

        return Ok(new { message = "Game dihapus." });
    }

    // --- Helpers ---

    private GameStateResponse BuildGameState(string gameId, GameSession session)
    {
        var ctrl = session.Controller;
        var players = ctrl.GetPlayers();
        var allPieces = ctrl.GetAllPieces();
        var current = ctrl.GetCurrentPlayer();

        return new GameStateResponse(
            gameId,
            ctrl.IsGameOver,
            ctrl.CurrentPlayerIndex,
            MapPlayer(current),
            players.Select(MapPlayer).ToList(),
            allPieces.ToDictionary(
                kvp => kvp.Key.ToString(),
                kvp => kvp.Value.Select(MapPiece).ToList()
            ),
            session.LastRoll,
            session.WinnerName
        );
    }

    private static PlayerResponse MapPlayer(IPlayer p)
        => new(p.Name, p.Color.ToString(), p.IsBot);

    private static PieceResponse MapPiece(IPiece p)
        => new(p.Id, p.Color.ToString(), p.CurrentStep, p.State.ToString());
}
