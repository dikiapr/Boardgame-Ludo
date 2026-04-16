using Ludo.Enums;
using Ludo.Interfaces;

namespace Ludo.Models;

public class Piece : IPiece
{
    public PlayerColor Color { get; }
    public Position CurrentPosition { get; set; }
    public int CurrentStep { get; set; }
    public PieceState State { get; set; }

    public Piece(PlayerColor color)
    {
        Color = color;
        State = PieceState.Base;
        CurrentStep = 0;
    }
}
