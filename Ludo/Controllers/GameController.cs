using Ludo.Enums;
using Ludo.Interfaces;
using Ludo.Models;

namespace Ludo.Controllers;

public class GameController : IGameController
{
    private readonly IList<IPlayer> _players;
    private readonly IDictionary<PlayerColor, IList<IPiece>> _pieces;
    private readonly IDictionary<PlayerColor, IList<Position>> _colorPath;
    private readonly IDice _dice;
    private readonly IBoard _board;

    private int _currentRollValue;
    private int _currentPlayerIndex;
    private bool _isGameOver;

    public bool IsGameOver => _isGameOver;
    public int CurrentPlayerIndex => _currentPlayerIndex;

    public event Action<IPiece, IPiece>? OnPieceCaptured;
    public event Action? OnGameFinished;

    public GameController(IDice dice, IBoard board, IList<string> playerNames)
    {
        _dice = dice;
        _board = board;
        _players = new List<IPlayer>();
        _pieces = new Dictionary<PlayerColor, IList<IPiece>>();
        _colorPath = new Dictionary<PlayerColor, IList<Position>>();
        _currentPlayerIndex = 0;
        _isGameOver = false;
        _currentRollValue = 0;
    }

    public IBoard GetBoard() => _board;

    public IDice GetDice() => _dice;

    public void StartGame()
    {
        // TODO: inisialisasi papan, posisi awal tiap pion, dan mulai giliran pertama
    }

    public int RollDice()
    {
        // TODO: lempar dadu, simpan hasilnya ke _currentRollValue, kembalikan nilainya
        return 0;
    }

    private IList<IPiece> GetMovablePieces(int steps)
    {
        // TODO: cari semua pion milik pemain saat ini yang bisa bergerak sejumlah 'steps'
        return new List<IPiece>();
    }

    private bool CanMove(IPiece piece, int steps)
    {
        // TODO: periksa apakah pion bisa bergerak sejumlah 'steps'
        return false;
    }

    private void HandleMoveLogic(IList<IPiece> movables)
    {
        // TODO: tangani alur pemilihan dan pergerakan pion
    }

    public IPiece ChoosePiece(IList<IPiece> movablePieces)
    {
        // TODO: minta pemain memilih pion dari daftar pion yang bisa bergerak
        return movablePieces[0];
    }

    public void MovePiece(IPlayer player, IPiece piece, int steps)
    {
        // TODO: pindahkan pion sesuai jumlah langkah, perbarui posisi dan state
    }

    private Position GetPositionFromPath(PlayerColor color, int step)
    {
        // TODO: kembalikan posisi di papan berdasarkan jalur warna dan langkah ke-n
        return new Position();
    }

    public ITile GetTileFromBoard(Position targetPos)
    {
        // TODO: ambil tile dari papan berdasarkan posisi
        return _board.Grid[targetPos.X][targetPos.Y];
    }

    private void EnterBoard(IPiece piece)
    {
        // TODO: keluarkan pion dari base ke posisi awal di papan
    }

    private void AddPieceToTile(ITile tile, IPiece piece)
    {
        // TODO: tambahkan pion ke daftar pion di tile tujuan
    }

    private void HandleEnter(IPiece piece)
    {
        // TODO: tangani logika saat pion pertama kali masuk ke papan (misalnya cek musuh)
    }

    private void RemovePieceFromTile(ITile tile, IPiece piece)
    {
        // TODO: hapus pion dari tile yang ditinggalkan
    }

    private bool HasEnemyPiece(IPiece piece)
    {
        // TODO: cek apakah tile tujuan mengandung pion milik pemain lain
        return false;
    }

    private void ReturnToBase(IPiece piece)
    {
        // TODO: kembalikan pion musuh ke base, set state-nya ke Base
    }

    public void NextTurn()
    {
        // TODO: pindah ke giliran pemain berikutnya, perbarui _currentPlayerIndex
    }

    private void HandleFinish(IPiece piece)
    {
        // TODO: tangani saat pion mencapai finish
    }

    private bool IsPieceAtFinish(IPiece piece)
    {
        // TODO: cek apakah pion sudah berada di posisi finish
        return false;
    }

    private void AddToFinished(IPiece piece)
    {
        // TODO: pindahkan pion ke daftar FinishedPieces di board, set state-nya ke Finished
    }

    private bool CheckWinner(IPlayer player)
    {
        // TODO: cek apakah semua pion milik player sudah Finished
        return false;
    }

    public void EndGame()
    {
        // TODO: tandai game selesai, naikkan event OnGameFinished
    }
}
