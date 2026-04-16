using Ludo.Enums;
using Ludo.Interfaces;

namespace Ludo.Models;

public class Player : IPlayer
{
    public string Name { get; }
    public PlayerColor Color { get; }

    public Player(string name, PlayerColor color)
    {
        Name = name;
        Color = color;
    }
}
