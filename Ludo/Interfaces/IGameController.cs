using Ludo.Enums;
using Ludo.Models;

namespace Ludo.Interfaces;

public interface IGameController
{
    bool IsGameOver { get; }
    int CurrentPlayerIndex { get; }

    void StartGame();
    int RollDice();
    IPlayer GetCurrentPlayer();
    IList<IPiece> GetMovablePieces();
    IPiece ChoosePiece(IList<IPiece> movablePieces);
    void MovePiece(IPlayer player, IPiece piece, int steps);
    ITile GetTileFromBoard(Position targetPos);
    void NextTurn();
    IBoard GetBoard();
    IDice GetDice();
    IList<IPlayer> GetPlayers();
    IDictionary<PlayerColor, IList<IPiece>> GetAllPieces();
    void EndGame();

    event Action<IPiece, IPiece>? OnPieceCaptured;
    event Action? OnGameFinished;
}
