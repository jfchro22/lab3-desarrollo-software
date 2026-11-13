using Microsoft.Data.Sqlite;

namespace Comparativo.Api;

public class Db
{
    private readonly string _cs;

    public Db(string path)
    {
        _cs = $"Data Source={path};Foreign Keys=True";
        using var c = Open();
        using var cmd = c.CreateCommand();
        cmd.CommandText = "PRAGMA journal_mode = WAL;";
        cmd.ExecuteNonQuery();
    }

    public SqliteConnection Open()
    {
        var c = new SqliteConnection(_cs);
        c.Open();
        return c;
    }
}
