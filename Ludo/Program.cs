using Ludo.Controllers;
using Ludo.Enums;
using Ludo.Interfaces;
using Ludo.Models;

Console.OutputEncoding = System.Text.Encoding.UTF8;

Console.WriteLine("=====================================");
Console.WriteLine("           LUDO GAME                 ");
Console.WriteLine("=====================================");
Console.WriteLine();

// --- Game Mode ---
Console.WriteLine("  Mode permainan:");
Console.WriteLine("    [1] Player vs Player");
Console.WriteLine("    [2] Player vs Bot");
Console.WriteLine();

int mode = 0;
while (mode != 1 && mode != 2)
{
    Console.Write("  Pilih mode (1/2): ");
    if (!int.TryParse(Console.ReadLine(), out mode) || (mode != 1 && mode != 2))
    {
        Console.WriteLine("  Masukkan 1 atau 2.");
        mode = 0;
    }
}
Console.WriteLine();

var playerNames = new List<string>();
var isBotList = new List<bool>();
var colors = Enum.GetValues<PlayerColor>();

if (mode == 1)
{
    // --- PvP Setup ---
    int playerCount = 0;
    while (playerCount < 2 || playerCount > 4)
    {
        Console.Write("Jumlah pemain (2-4): ");
        if (!int.TryParse(Console.ReadLine(), out playerCount) || playerCount < 2 || playerCount > 4)
        {
            Console.WriteLine("Masukkan angka antara 2 dan 4.");
            playerCount = 0;
        }
    }

    for (int i = 0; i < playerCount; i++)
    {
        Console.Write($"Nama pemain {i + 1} ({colors[i]}): ");
        var name = Console.ReadLine()?.Trim();
        if (string.IsNullOrEmpty(name)) name = $"Player {i + 1}";
        playerNames.Add(name);
        isBotList.Add(false);
    }
}
else
{
    // --- PvB Setup ---
    int totalPlayers = 0;
    while (totalPlayers < 2 || totalPlayers > 4)
    {
        Console.Write("Total pemain termasuk bot (2-4): ");
        if (!int.TryParse(Console.ReadLine(), out totalPlayers) || totalPlayers < 2 || totalPlayers > 4)
        {
            Console.WriteLine("Masukkan angka antara 2 dan 4.");
            totalPlayers = 0;
        }
    }

    int humanCount = 0;
    while (humanCount < 1 || humanCount >= totalPlayers)
    {
        Console.Write($"Jumlah pemain manusia (1-{totalPlayers - 1}): ");
        if (!int.TryParse(Console.ReadLine(), out humanCount) || humanCount < 1 || humanCount >= totalPlayers)
        {
            Console.WriteLine($"Masukkan angka antara 1 dan {totalPlayers - 1}.");
            humanCount = 0;
        }
    }

    for (int i = 0; i < humanCount; i++)
    {
        Console.Write($"Nama pemain {i + 1} ({colors[i]}): ");
        var name = Console.ReadLine()?.Trim();
        if (string.IsNullOrEmpty(name)) name = $"Player {i + 1}";
        playerNames.Add(name);
        isBotList.Add(false);
    }

    for (int i = humanCount; i < totalPlayers; i++)
    {
        var botName = $"Bot {i - humanCount + 1}";
        playerNames.Add(botName);
        isBotList.Add(true);
        Console.WriteLine($"  {botName} ({colors[i]}) bergabung!");
    }
}

Console.WriteLine();

// --- Initialize Game ---
var dice = new Dice();
var board = new Board(15, 15);
var controller = new GameController(dice, board, playerNames, isBotList);

controller.OnPieceCaptured += (attacker, captured) =>
{
    Console.ForegroundColor = ConsoleColor.Yellow;
    Console.WriteLine($"  >> {attacker} menangkap {captured}! Kembali ke base!");
    Console.ResetColor();
};

controller.OnGameFinished += () =>
{
    Console.ForegroundColor = ConsoleColor.Green;
    Console.WriteLine("\n===== GAME OVER =====");
    Console.ResetColor();
};

controller.StartGame();

// --- Game Loop ---
while (!controller.IsGameOver)
{
    var currentPlayer = controller.GetCurrentPlayer();
    var allPieces = controller.GetAllPieces();
    bool isBot = currentPlayer.IsBot;

    Console.WriteLine("-------------------------------------");
    DisplayAllPieces(controller.GetPlayers(), allPieces);
    Console.WriteLine();

    Console.ForegroundColor = GetConsoleColor(currentPlayer.Color);
    string tag = isBot ? " [BOT]" : "";
    Console.WriteLine($"  Giliran: {currentPlayer.Name} ({currentPlayer.Color}){tag}");
    Console.ResetColor();

    if (!isBot)
    {
        Console.Write("  Tekan Enter untuk lempar dadu...");
        Console.ReadLine();
    }
    else
    {
        Console.WriteLine("  Bot melempar dadu...");
    }

    int roll = controller.RollDice();
    Console.Write("  Dadu: ");
    Console.ForegroundColor = ConsoleColor.Cyan;
    Console.WriteLine(roll);
    Console.ResetColor();

    if (roll == 6)
    {
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine("  * Dapat 6! Bonus giliran setelah ini!");
        Console.ResetColor();
    }

    var movablePieces = controller.GetMovablePieces();

    if (movablePieces.Count == 0)
    {
        Console.ForegroundColor = ConsoleColor.DarkGray;
        Console.WriteLine("  Tidak ada pion yang bisa bergerak. Giliran dilewati.");
        Console.ResetColor();
        controller.NextTurn();
        continue;
    }

    // Display movable pieces
    Console.WriteLine("  Pion yang bisa bergerak:");
    for (int i = 0; i < movablePieces.Count; i++)
    {
        var p = movablePieces[i];
        string status = p.State == PieceState.Base
            ? "BASE -> Masuk papan"
            : $"Langkah {p.CurrentStep} -> {p.CurrentStep + roll}";
        Console.WriteLine($"    [{i + 1}] Pion {p.Id} ({status})");
    }

    // Choose piece
    IPiece chosen;
    if (isBot)
    {
        chosen = controller.BotChoosePiece(movablePieces);
        Console.ForegroundColor = ConsoleColor.Magenta;
        Console.WriteLine($"  Bot memilih Pion {chosen.Id}");
        Console.ResetColor();
    }
    else if (movablePieces.Count == 1)
    {
        chosen = movablePieces[0];
        Console.WriteLine($"  Otomatis memilih Pion {chosen.Id}");
    }
    else
    {
        int choice = 0;
        while (choice < 1 || choice > movablePieces.Count)
        {
            Console.Write($"  Pilih pion (1-{movablePieces.Count}): ");
            if (!int.TryParse(Console.ReadLine(), out choice) || choice < 1 || choice > movablePieces.Count)
            {
                Console.WriteLine("  Pilihan tidak valid.");
                choice = 0;
            }
        }
        chosen = movablePieces[choice - 1];
    }

    var prevState = chosen.State;
    controller.MovePiece(currentPlayer, chosen, roll);

    // Show result
    if (prevState == PieceState.Base && chosen.State == PieceState.Active)
    {
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine($"  Pion {chosen.Id} masuk ke papan!");
        Console.ResetColor();
    }
    else if (chosen.State == PieceState.Finished)
    {
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine($"  Pion {chosen.Id} sampai di FINISH!");
        Console.ResetColor();
    }
    else
    {
        string zone = chosen.CurrentStep > 51 ? " (Home Stretch)" : "";
        Console.WriteLine($"  Pion {chosen.Id} bergerak ke langkah {chosen.CurrentStep}{zone}");
    }

    controller.NextTurn();
}

// --- Show Winner ---
var players = controller.GetPlayers();
var pieces = controller.GetAllPieces();
foreach (var player in players)
{
    if (pieces[player.Color].All(p => p.State == PieceState.Finished))
    {
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine($"\n  PEMENANG: {player.Name} ({player.Color})!");
        Console.ResetColor();
        break;
    }
}

Console.WriteLine("\nTerima kasih sudah bermain Ludo!\n");

// --- Helper Methods ---

static void DisplayAllPieces(IList<IPlayer> players, IDictionary<PlayerColor, IList<IPiece>> allPieces)
{
    foreach (var player in players)
    {
        Console.ForegroundColor = GetConsoleColor(player.Color);
        string botTag = player.IsBot ? " *" : "";
        Console.Write($"  {player.Name,-12} ({player.Color,-6}){botTag}: ");
        Console.ResetColor();

        var pcs = allPieces[player.Color];
        var statuses = pcs.Select(p =>
        {
            return p.State switch
            {
                PieceState.Base => $"P{p.Id}[BASE]",
                PieceState.Finished => $"P{p.Id}[DONE]",
                _ => p.CurrentStep > 51
                    ? $"P{p.Id}[H:{p.CurrentStep - 51}]"
                    : $"P{p.Id}[S:{p.CurrentStep}]"
            };
        });
        Console.WriteLine(string.Join("  ", statuses));
    }
}

static ConsoleColor GetConsoleColor(PlayerColor color)
{
    return color switch
    {
        PlayerColor.Red => ConsoleColor.Red,
        PlayerColor.Blue => ConsoleColor.Blue,
        PlayerColor.Green => ConsoleColor.Green,
        PlayerColor.Yellow => ConsoleColor.Yellow,
        _ => ConsoleColor.White
    };
}
