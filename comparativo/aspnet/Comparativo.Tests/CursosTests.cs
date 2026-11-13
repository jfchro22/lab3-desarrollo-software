using Xunit;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;

namespace Comparativo.Tests;

public class Fx : WebApplicationFactory<Program>
{
    public readonly string Ruta = Path.Combine(Path.GetTempPath(), $"aspnet-test-{Guid.NewGuid():N}.sqlite");

    public Fx()
    {
        using (var c = new SqliteConnection($"Data Source={Ruta}"))
        {
            c.Open();
            var cmd = c.CreateCommand();
            cmd.CommandText = @"
                CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, password TEXT, role TEXT);
                CREATE TABLE profesores (id INTEGER PRIMARY KEY, nombre TEXT);
                CREATE TABLE categorias (id INTEGER PRIMARY KEY, nombre TEXT);
                CREATE TABLE cursos (id INTEGER PRIMARY KEY, nombre TEXT, creditos INTEGER, profesor_id INTEGER, created_at TEXT, updated_at TEXT);
                CREATE TABLE curso_categoria (curso_id INTEGER, categoria_id INTEGER);
                CREATE TABLE matriculas (id INTEGER PRIMARY KEY, estudiante_id INTEGER, curso_id INTEGER);
                INSERT INTO profesores VALUES (1,'Profe Uno'); INSERT INTO categorias VALUES (1,'InformÃ¡tica');
                INSERT INTO users (name,email,password,role) VALUES ('Admin','admin@test.com',$hash,'admin');";
            cmd.Parameters.AddWithValue("$hash", BCrypt.Net.BCrypt.HashPassword("Clave1234"));
            cmd.ExecuteNonQuery();
        }
        Environment.SetEnvironmentVariable("DB_PATH", Ruta);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        SqliteConnection.ClearAllPools();
        try { File.Delete(Ruta); } catch { }
    }
}

public class CursosTests(Fx fx) : IClassFixture<Fx>
{
    private readonly HttpClient _http = fx.CreateClient();

    private async Task<string> Token()
    {
        var r = await _http.PostAsJsonAsync("/api/login", new { email = "admin@test.com", password = "Clave1234" });
        return (await r.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("token").GetString()!;
    }

    private async Task<HttpClient> Autenticado()
    {
        var c = fx.CreateClient();
        c.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await Token());
        return c;
    }

    [Fact]
    public async Task Login_200_con_token_401_con_credenciales_incorrectas_422_con_datos_invalidos()
    {
        var ok = await _http.PostAsJsonAsync("/api/login", new { email = "admin@test.com", password = "Clave1234" });
        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);
        var body = await ok.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("token", out _));
        Assert.Equal("admin", body.GetProperty("usuario").GetProperty("role").GetString());

        var mala = await _http.PostAsJsonAsync("/api/login", new { email = "admin@test.com", password = "mala" });
        Assert.Equal(HttpStatusCode.Unauthorized, mala.StatusCode);

        var invalida = await _http.PostAsJsonAsync("/api/login", new { email = "no-es-correo" });
        Assert.Equal((HttpStatusCode)422, invalida.StatusCode);
    }

    [Fact]
    public async Task Listado_401_sin_token_y_200_paginado_con_token()
    {
        Assert.Equal(HttpStatusCode.Unauthorized, (await _http.GetAsync("/api/cursos")).StatusCode);
        var c = await Autenticado();
        var r = await c.GetAsync("/api/cursos?page=1&per_page=10");
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        var body = await r.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("data", out _));
        Assert.Equal(1, body.GetProperty("meta").GetProperty("current_page").GetInt32());
        Assert.Equal(10, body.GetProperty("meta").GetProperty("per_page").GetInt32());
    }

    [Fact]
    public async Task Creacion_422_invalida_201_con_Location_y_404_al_consultar_inexistente()
    {
        var c = await Autenticado();
        var mala = await c.PostAsJsonAsync("/api/cursos", new { nombre = "x", creditos = 9 });
        Assert.Equal((HttpStatusCode)422, mala.StatusCode);
        var errors = (await mala.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.True(errors.TryGetProperty("nombre", out _));
        Assert.True(errors.TryGetProperty("creditos", out _));

        var ok = await c.PostAsJsonAsync("/api/cursos", new { nombre = "Curso de prueba", creditos = 3, profesor_id = 1, categoria_ids = new[] { 1 } });
        Assert.Equal(HttpStatusCode.Created, ok.StatusCode);
        Assert.Matches(@"/api/cursos/\d+$", ok.Headers.Location!.ToString());
        var id = (await ok.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data").GetProperty("id").GetInt64();

        Assert.Equal(HttpStatusCode.NotFound, (await c.GetAsync("/api/cursos/99999")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await c.DeleteAsync($"/api/cursos/{id}")).StatusCode);
    }
}

