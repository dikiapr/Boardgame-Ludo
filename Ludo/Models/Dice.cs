using Ludo.Interfaces;

namespace Ludo.Models;

public class Dice : IDice
{
    private readonly int _value;

    public int Value => _value;

    public Dice(int value)
    {
        _value = value;
    }
}
