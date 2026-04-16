using Ludo.Models;

namespace Ludo.Interfaces;

public interface IGameController
{
    bool IsGameOver { get; }
    int CurrentPlayerIndex { get; }

    void StartGame();
    int RollDice();
    IPiece ChoosePiece(IList<IPiece> movablePieces);
    void MovePiece(IPlayer player, IPiece piece, int steps);
    ITile GetTileFromBoard(Position targetPos);
    void NextTurn();
    IBoard GetBoard();
    IDice GetDice();
    void EndGame();

    event Action<IPiece, IPiece> OnPieceCaptured;
    event Action OnGameFinished;
}
