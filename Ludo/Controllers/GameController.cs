using Ludo.Enums;
using Ludo.Interfaces;
using Ludo.Models;

namespace Ludo.Controllers;

public class GameController : IGameController
{
    private readonly IList<IPlayer> _players;
    private readonly IDictionary<PlayerColor, IList<IPiece>> _pieces;
    private readonly IDice _dice;
    private readonly IBoard _board;

    private int _currentRollValue;
    private int _currentPlayerIndex;
    private bool _isGameOver;

    private const int MainTrackSize = 52;
    private const int TotalSteps = 57;
    private const int HomeStretchStart = 52;
    private const int PiecesPerPlayer = 4;
    private static readonly Random _random = new();

    private static readonly Dictionary<PlayerColor, int> StartOffsets = new()
    {
        { PlayerColor.Red, 0 },
        { PlayerColor.Blue, 13 },
        { PlayerColor.Green, 26 },
        { PlayerColor.Yellow, 39 }
    };

    public bool IsGameOver => _isGameOver;
    public int CurrentPlayerIndex => _currentPlayerIndex;

    public event Action<IPiece, IPiece>? OnPieceCaptured;
    public event Action? OnGameFinished;

    public GameController(IDice dice, IBoard board, IList<string> playerNames, IList<bool>? isBotList = null)
    {
        _dice = dice;
        _board = board;
        _players = new List<IPlayer>();
        _pieces = new Dictionary<PlayerColor, IList<IPiece>>();
        _currentPlayerIndex = 0;
        _isGameOver = false;
        _currentRollValue = 0;

        var colors = Enum.GetValues<PlayerColor>();
        for (int i = 0; i < playerNames.Count && i < colors.Length; i++)
        {
            var color = colors[i];
            bool isBot = isBotList != null && i < isBotList.Count && isBotList[i];
            _players.Add(new Player(playerNames[i], color, isBot));

            var pieces = new List<IPiece>();
            for (int j = 0; j < PiecesPerPlayer; j++)
            {
                pieces.Add(new Piece(j + 1, color));
            }
            _pieces[color] = pieces;
        }
    }

    public IBoard GetBoard() => _board;
    public IDice GetDice() => _dice;
    public IPlayer GetCurrentPlayer() => _players[_currentPlayerIndex];
    public IList<IPlayer> GetPlayers() => _players;
    public IDictionary<PlayerColor, IList<IPiece>> GetAllPieces() => _pieces;

    public void StartGame()
    {
        _currentPlayerIndex = 0;
        _isGameOver = false;
    }

    public int RollDice()
    {
        _currentRollValue = _random.Next(1, 7);
        _dice.Value = _currentRollValue;
        return _currentRollValue;
    }

    public IList<IPiece> GetMovablePieces()
    {
        var player = _players[_currentPlayerIndex];
        var pieces = _pieces[player.Color];
        return pieces.Where(p => CanMove(p, _currentRollValue)).ToList();
    }

    private bool CanMove(IPiece piece, int steps)
    {
        if (piece.State == PieceState.Finished) return false;
        if (piece.State == PieceState.Base) return steps == 6;
        return piece.CurrentStep + steps <= TotalSteps;
    }

    public IPiece ChoosePiece(IList<IPiece> movablePieces)
    {
        return movablePieces[0];
    }

    public IPiece BotChoosePiece(IList<IPiece> movablePieces)
    {
        // Prioritas: 1) Capture musuh, 2) Keluar dari base, 3) Pion paling depan
        var player = _players[_currentPlayerIndex];

        // Cek apakah ada pion yang bisa capture musuh
        foreach (var piece in movablePieces)
        {
            int futureStep = piece.State == PieceState.Base ? 1 : piece.CurrentStep + _currentRollValue;
            if (futureStep >= 1 && futureStep <= 51)
            {
                int globalPos = GetGlobalTrackPosition(player.Color, futureStep);
                if (globalPos >= 0 && !IsSafeTile(globalPos) && HasEnemyAtGlobal(player.Color, globalPos))
                    return piece;
            }
        }

        // Keluarkan pion dari base jika bisa
        var basePiece = movablePieces.FirstOrDefault(p => p.State == PieceState.Base);
        if (basePiece != null) return basePiece;

        // Pilih pion yang paling dekat finish
        return movablePieces.OrderByDescending(p => p.CurrentStep).First();
    }

    private bool HasEnemyAtGlobal(PlayerColor myColor, int globalPos)
    {
        foreach (var kvp in _pieces)
        {
            if (kvp.Key == myColor) continue;
            foreach (var enemy in kvp.Value)
            {
                if (enemy.State != PieceState.Active || enemy.CurrentStep < 1 || enemy.CurrentStep > 51)
                    continue;
                if (GetGlobalTrackPosition(enemy.Color, enemy.CurrentStep) == globalPos)
                    return true;
            }
        }
        return false;
    }

    public void MovePiece(IPlayer player, IPiece piece, int steps)
    {
        if (piece.State == PieceState.Base && steps == 6)
        {
            EnterBoard(piece);
            return;
        }

        if (piece.State == PieceState.Active)
        {
            piece.CurrentStep += steps;

            if (piece.CurrentStep >= TotalSteps)
            {
                HandleFinish(piece);
                return;
            }

            if (piece.CurrentStep >= 1 && piece.CurrentStep <= 51)
            {
                CheckAndCapture(piece);
            }
        }
    }

    private void EnterBoard(IPiece piece)
    {
        piece.State = PieceState.Active;
        piece.CurrentStep = 1;
        CheckAndCapture(piece);
    }

    private void CheckAndCapture(IPiece piece)
    {
        int globalPos = GetGlobalTrackPosition(piece.Color, piece.CurrentStep);
        if (globalPos < 0) return;
        if (IsSafeTile(globalPos)) return;

        foreach (var kvp in _pieces)
        {
            if (kvp.Key == piece.Color) continue;

            foreach (var enemyPiece in kvp.Value)
            {
                if (enemyPiece.State != PieceState.Active) continue;
                if (enemyPiece.CurrentStep < 1 || enemyPiece.CurrentStep > 51) continue;

                int enemyGlobalPos = GetGlobalTrackPosition(enemyPiece.Color, enemyPiece.CurrentStep);
                if (enemyGlobalPos == globalPos)
                {
                    ReturnToBase(enemyPiece);
                    OnPieceCaptured?.Invoke(piece, enemyPiece);
                }
            }
        }
    }

    private bool IsSafeTile(int globalPosition)
    {
        return StartOffsets.ContainsValue(globalPosition);
    }

    private int GetGlobalTrackPosition(PlayerColor color, int step)
    {
        if (step < 1 || step > 51) return -1;
        return (StartOffsets[color] + step - 1) % MainTrackSize;
    }

    private void ReturnToBase(IPiece piece)
    {
        piece.State = PieceState.Base;
        piece.CurrentStep = 0;
    }

    private void HandleFinish(IPiece piece)
    {
        piece.State = PieceState.Finished;
        piece.CurrentStep = TotalSteps;
        _board.FinishedPieces.Add(piece);

        var player = _players[_currentPlayerIndex];
        if (CheckWinner(player))
        {
            EndGame();
        }
    }

    private bool CheckWinner(IPlayer player)
    {
        return _pieces[player.Color].All(p => p.State == PieceState.Finished);
    }

    public ITile GetTileFromBoard(Position targetPos)
    {
        return _board.Grid[targetPos.X][targetPos.Y];
    }

    public void NextTurn()
    {
        if (_currentRollValue != 6)
        {
            _currentPlayerIndex = (_currentPlayerIndex + 1) % _players.Count;
        }
    }

    public void EndGame()
    {
        _isGameOver = true;
        OnGameFinished?.Invoke();
    }
}
