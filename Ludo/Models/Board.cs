using Ludo.Interfaces;

namespace Ludo.Models;

public class Board : IBoard
{
    public ITile[][] Grid { get; }
    public IList<IPiece> FinishedPieces { get; }

    public Board(int rows, int cols)
    {
        FinishedPieces = new List<IPiece>();
        Grid = new ITile[rows][];

        for (int i = 0; i < rows; i++)
        {
            Grid[i] = new ITile[cols];
        }
    }
}
