using Ludo.Controllers;
using Ludo.Enums;
using Ludo.Interfaces;

namespace Ludo.Api.Models;

public class GameSession
{
    public string Id { get; }
    public GameController Controller { get; }
    public int? LastRoll { get; set; }
    public IList<IPiece>? LastMovablePieces { get; set; }
    public bool PieceCapturedThisTurn { get; set; }
    public string? CapturedPieceInfo { get; set; }
    public string? WinnerName { get; set; }

    public GameSession(string id, GameController controller)
    {
        Id = id;
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

    public void ResetCaptureFlags()
    {
        PieceCapturedThisTurn = false;
        CapturedPieceInfo = null;
    }

    public void ClearLastRoll()
    {
        LastRoll = null;
        LastMovablePieces = null;
    }
}
