using Ludo.Enums;
using Ludo.Interfaces;

namespace Ludo.Models;

public class Tile : ITile
{
    public Position Position { get; }
    public TileType Type { get; }
    public IList<IPiece> Pieces { get; }

    public Tile(Position pos, TileType type)
    {
        Position = pos;
        Type = type;
        Pieces = new List<IPiece>();
    }
}
