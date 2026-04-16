namespace Ludo.Interfaces;

public interface IBoard
{
    ITile[][] Grid { get; }
    IList<IPiece> FinishedPieces { get; }
}
