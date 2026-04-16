using Ludo.Enums;
using Ludo.Interfaces;

namespace Ludo.Models;

public class Player : IPlayer
{
    public string Name { get; }
    public PlayerColor Color { get; }
    public bool IsBot { get; }

    public Player(string name, PlayerColor color, bool isBot = false)
    {
        Name = name;
        Color = color;
        IsBot = isBot;
    }
}
