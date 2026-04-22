using Ludo.Api.Common;
using Ludo.Api.DTOs.Requests;
using Ludo.Api.DTOs.Responses;
using Ludo.Api.Mappers;
using Ludo.Api.Models;
using Ludo.Enums;
using Ludo.Interfaces;

namespace Ludo.Api.Services;

public class GameService : IGameService
{
    private const int MinPlayers = 2;
    private const int MaxPlayers = 4;
    private const int BonusRoll = 6;
    private const int HomeStretchStart = 52;

    private readonly IGameSessionManager _sessionManager;

    public GameService(IGameSessionManager sessionManager)
    {
        _sessionManager = sessionManager;
    }

    public OperationResult<GameStateResponse> CreateGame(CreateGameRequest request)
    {
        if (request.Players.Count is < MinPlayers or > MaxPlayers)
            return OperationResult<GameStateResponse>.BadRequest(
                $"Jumlah pemain harus antara {MinPlayers} dan {MaxPlayers}.");

        if (request.Players.All(p => p.IsBot))
            return OperationResult<GameStateResponse>.BadRequest("Minimal harus ada 1 pemain manusia.");

        var names = request.Players.Select(p => p.Name).ToList();
        var bots = request.Players.Select(p => p.IsBot).ToList();

        var session = _sessionManager.CreateGame(names, bots);
        return OperationResult<GameStateResponse>.Ok(session.ToStateResponse());
    }

    public OperationResult<GameStateResponse> GetGameState(string gameId)
    {
        var session = _sessionManager.GetSession(gameId);
        if (session == null)
            return OperationResult<GameStateResponse>.NotFound("Game tidak ditemukan.");

        return OperationResult<GameStateResponse>.Ok(session.ToStateResponse());
    }

    public OperationResult<RollDiceResponse> RollDice(string gameId)
    {
        var session = _sessionManager.GetSession(gameId);
        if (session == null)
            return OperationResult<RollDiceResponse>.NotFound("Game tidak ditemukan.");

        var controller = session.Controller;
        if (controller.IsGameOver)
            return OperationResult<RollDiceResponse>.BadRequest("Game sudah selesai.");

        session.ResetCaptureFlags();

        int roll = controller.RollDice();
        session.LastRoll = roll;

        var movablePieces = controller.GetMovablePieces();
        session.LastMovablePieces = movablePieces;

        if (movablePieces.Count == 0)
            controller.NextTurn();

        var movableResponses = movablePieces
            .Select(p => BuildMovablePieceResponse(p, roll))
            .ToList();

        return OperationResult<RollDiceResponse>.Ok(
            new RollDiceResponse(roll, roll == BonusRoll, movableResponses));
    }

    public OperationResult<MovePieceResponse> MovePiece(string gameId, MovePieceRequest request)
    {
        var session = _sessionManager.GetSession(gameId);
        if (session == null)
            return OperationResult<MovePieceResponse>.NotFound("Game tidak ditemukan.");

        var controller = session.Controller;
        if (controller.IsGameOver)
            return OperationResult<MovePieceResponse>.BadRequest("Game sudah selesai.");

        if (session.LastMovablePieces == null || session.LastRoll == null)
            return OperationResult<MovePieceResponse>.BadRequest("Lempar dadu terlebih dahulu.");

        var piece = session.LastMovablePieces.FirstOrDefault(p => p.Id == request.PieceId);
        if (piece == null)
            return OperationResult<MovePieceResponse>.BadRequest(
                $"Pion {request.PieceId} tidak bisa bergerak saat ini.");

        var currentPlayer = controller.GetCurrentPlayer();
        var prevState = piece.State;

        session.ResetCaptureFlags();
        controller.MovePiece(currentPlayer, piece, session.LastRoll.Value);

        var resultMessage = BuildMoveResultMessage(piece, prevState);

        controller.NextTurn();
        session.ClearLastRoll();

        return OperationResult<MovePieceResponse>.Ok(new MovePieceResponse(
            piece.ToResponse(),
            resultMessage,
            session.PieceCapturedThisTurn,
            session.CapturedPieceInfo,
            controller.IsGameOver,
            session.WinnerName
        ));
    }

    public OperationResult<MovePieceResponse> BotMove(string gameId)
    {
        var session = _sessionManager.GetSession(gameId);
        if (session == null)
            return OperationResult<MovePieceResponse>.NotFound("Game tidak ditemukan.");

        var controller = session.Controller;
        if (controller.IsGameOver)
            return OperationResult<MovePieceResponse>.BadRequest("Game sudah selesai.");

        var currentPlayer = controller.GetCurrentPlayer();
        if (!currentPlayer.IsBot)
            return OperationResult<MovePieceResponse>.BadRequest("Giliran saat ini bukan bot.");

        session.ResetCaptureFlags();

        int roll = controller.RollDice();
        session.LastRoll = roll;

        var movablePieces = controller.GetMovablePieces();

        if (movablePieces.Count == 0)
        {
            controller.NextTurn();
            return OperationResult<MovePieceResponse>.Ok(new MovePieceResponse(
                null,
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

        var resultMessage = $"Bot melempar {roll}. {BuildMoveResultMessage(chosen, prevState)}";

        controller.NextTurn();
        session.ClearLastRoll();

        return OperationResult<MovePieceResponse>.Ok(new MovePieceResponse(
            chosen.ToResponse(),
            resultMessage,
            session.PieceCapturedThisTurn,
            session.CapturedPieceInfo,
            controller.IsGameOver,
            session.WinnerName
        ));
    }

    public OperationResult<bool> DeleteGame(string gameId)
    {
        if (!_sessionManager.RemoveSession(gameId))
            return OperationResult<bool>.NotFound("Game tidak ditemukan.");

        return OperationResult<bool>.Ok(true);
    }

    private static MovablePieceResponse BuildMovablePieceResponse(IPiece piece, int roll)
    {
        string description = piece.State == PieceState.Base
            ? "BASE -> Masuk papan"
            : $"Langkah {piece.CurrentStep} -> {piece.CurrentStep + roll}";

        return new MovablePieceResponse(
            piece.Id,
            piece.State.ToString(),
            piece.CurrentStep,
            description
        );
    }

    private static string BuildMoveResultMessage(IPiece piece, PieceState previousState)
    {
        if (previousState == PieceState.Base && piece.State == PieceState.Active)
            return $"Pion {piece.Id} masuk ke papan!";

        if (piece.State == PieceState.Finished)
            return $"Pion {piece.Id} sampai di FINISH!";

        string zone = piece.CurrentStep >= HomeStretchStart ? " (Home Stretch)" : "";
        return $"Pion {piece.Id} bergerak ke langkah {piece.CurrentStep}{zone}";
    }
}
