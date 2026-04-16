using Ludo.Enums;
using Ludo.Models;

namespace Ludo.Interfaces;

public interface IPiece
{
    PlayerColor Color { get; }
    Position CurrentPosition { get; set; }
    int CurrentStep { get; set; }
    PieceState State { get; set; }
}
