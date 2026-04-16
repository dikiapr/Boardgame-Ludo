using Ludo.Enums;

namespace Ludo.Interfaces;

public interface IPlayer
{
    string Name { get; }
    PlayerColor Color { get; }
}
