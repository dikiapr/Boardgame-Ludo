using Ludo.Enums;

namespace Ludo.Interfaces;

public interface IGameController
{
    bool IsGameOver { get; }
    int CurrentPlayerIndex { get; }

    event Action<IPiece, IPiece>? OnPieceCaptured;
    event Action? OnGameFinished;

    void StartGame();
    int RollDice();
    IPlayer GetCurrentPlayer();
    IList<IPiece> GetMovablePieces();
    IPiece ChoosePiece(IList<IPiece> movablePieces);
    void MovePiece(IPlayer player, IPiece piece, int steps);
    void NextTurn();
    IList<IPlayer> GetPlayers();
    IDictionary<PlayerColor, IList<IPiece>> GetAllPieces();
    void EndGame();
}
