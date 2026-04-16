using Ludo.Enums;
using Ludo.Interfaces;

namespace Ludo.Models;

public class Piece : IPiece
{
    public int Id { get; }
    public PlayerColor Color { get; }
    public Position CurrentPosition { get; set; }
    public int CurrentStep { get; set; }
    public PieceState State { get; set; }

    public Piece(int id, PlayerColor color)
    {
        Id = id;
        Color = color;
        State = PieceState.Base;
        CurrentStep = 0;
    }

    public override string ToString() => $"Piece {Id} ({Color})";
}
