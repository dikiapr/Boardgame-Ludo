using Ludo.Enums;
using Ludo.Models;

namespace Ludo.Interfaces;

public interface ITile
{
    Position Position { get; }
    TileType Type { get; }
    IList<IPiece> Pieces { get; }
}
