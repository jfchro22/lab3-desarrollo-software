using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;

namespace Comparativo.Api.Controllers;

[ApiController]
[Route("api/cursos")]
[Authorize]
[Tags("Cursos")]
public class CursosController(Db db) : ControllerBase
{
    private const string Sel = "SELECT id AS Id, nombre AS Nombre, creditos AS Creditos, profesor_id AS ProfesorId FROM cursos";

    private static string Ahora() => DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");

    private static object Fila(CursoRow c) => new { id = c.Id, nombre = c.Nombre, creditos = c.Creditos, profesor_id = c.ProfesorId };

    // [validacion:inicio]
    private IActionResult Error422(Dictionary<string, string[]> errors) =>
        new ObjectResult(new { message = "Los datos proporcionados no son válidos.", errors }) { StatusCode = 422 };

    private Dictionary<string, string[]> ValidarRefs(SqliteConnection c, string? nombre, int? profesorId, List<int>? categorias, long ignorarId = 0)
    {
        var errors = new Dictionary<string, string[]>();
        if (nombre is not null && c.ExecuteScalar<long?>("SELECT 1 FROM cursos WHERE nombre = @n AND id <> @i", new { n = nombre, i = ignorarId }) is not null)
            errors["nombre"] = new[] { "Ya existe un curso con ese nombre." };
        if (profesorId is not null && c.ExecuteScalar<long?>("SELECT 1 FROM profesores WHERE id = @i", new { i = profesorId }) is null)
            errors["profesor_id"] = new[] { "El profesor indicado no existe." };
        if (categorias is not null && categorias.Any(id => c.ExecuteScalar<long?>("SELECT 1 FROM categorias WHERE id = @i", new { i = id }) is null))
            errors["categoria_ids"] = new[] { "Una de las categorías indicadas no existe." };
        return errors;
    }
    // [validacion:fin]

    private object? Detalle(SqliteConnection c, long id)
    {
        var cur = c.QueryFirstOrDefault<CursoRow>(Sel + " WHERE id = @id", new { id });
        if (cur is null) return null;
        var cats = c.Query("SELECT ca.id AS id, ca.nombre AS nombre FROM categorias ca JOIN curso_categoria cc ON cc.categoria_id = ca.id WHERE cc.curso_id = @id", new { id });
        return new { data = new { id = cur.Id, nombre = cur.Nombre, creditos = cur.Creditos, profesor_id = cur.ProfesorId, categorias = cats } };
    }

    [HttpGet]
    public IActionResult Listar([FromQuery] ListarQuery q)
    {
        int page = q.Page ?? 1, perPage = q.PerPage ?? 15;
        var like = string.IsNullOrEmpty(q.Nombre) ? "%" : $"%{q.Nombre}%";
        using var c = db.Open();
        var total = c.ExecuteScalar<long>("SELECT COUNT(*) FROM cursos WHERE nombre LIKE @l", new { l = like });
        var rows = c.Query<CursoRow>(Sel + " WHERE nombre LIKE @l ORDER BY id LIMIT @lim OFFSET @off",
            new { l = like, lim = perPage, off = (page - 1) * perPage }).Select(Fila);
        return Ok(new
        {
            data = rows,
            meta = new { current_page = page, per_page = perPage, total, last_page = Math.Max(1, (int)Math.Ceiling(total / (double)perPage)) },
        });
    }

    [HttpGet("{id:long}")]
    public IActionResult Mostrar(long id)
    {
        using var c = db.Open();
        var r = Detalle(c, id);
        return r is null ? NotFound(new { message = "Recurso no encontrado." }) : Ok(r);
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public IActionResult Crear(CrearCursoDto dto)
    {
        using var c = db.Open();
        var errors = ValidarRefs(c, dto.Nombre, dto.ProfesorId, dto.CategoriaIds);
        if (errors.Count > 0) return Error422(errors);

        using var tx = c.BeginTransaction();
        var t = Ahora();
        var id = c.ExecuteScalar<long>(
            "INSERT INTO cursos (nombre, creditos, profesor_id, created_at, updated_at) VALUES (@n, @cr, @p, @t, @t); SELECT last_insert_rowid();",
            new { n = dto.Nombre, cr = dto.Creditos, p = dto.ProfesorId, t }, tx);
        foreach (var cat in dto.CategoriaIds!)
            c.Execute("INSERT INTO curso_categoria (curso_id, categoria_id) VALUES (@id, @cat)", new { id, cat }, tx);
        tx.Commit();
        return Created($"/api/cursos/{id}", Detalle(c, id));
    }

    [HttpPut("{id:long}")]
    [HttpPatch("{id:long}")]
    [Authorize(Roles = "admin")]
    public IActionResult Actualizar(long id, ActualizarCursoDto dto)
    {
        using var c = db.Open();
        var actual = c.QueryFirstOrDefault<CursoRow>(Sel + " WHERE id = @id", new { id });
        if (actual is null) return NotFound(new { message = "Recurso no encontrado." });
        var errors = ValidarRefs(c, dto.Nombre, dto.ProfesorId, dto.CategoriaIds, id);
        if (errors.Count > 0) return Error422(errors);

        using var tx = c.BeginTransaction();
        c.Execute("UPDATE cursos SET nombre = @n, creditos = @cr, profesor_id = @p, updated_at = @t WHERE id = @id",
            new { n = dto.Nombre ?? actual.Nombre, cr = dto.Creditos ?? (int)actual.Creditos, p = dto.ProfesorId ?? (int)actual.ProfesorId, t = Ahora(), id }, tx);
        if (dto.CategoriaIds is not null)
        {
            c.Execute("DELETE FROM curso_categoria WHERE curso_id = @id", new { id }, tx);
            foreach (var cat in dto.CategoriaIds)
                c.Execute("INSERT INTO curso_categoria (curso_id, categoria_id) VALUES (@id, @cat)", new { id, cat }, tx);
        }
        tx.Commit();
        return Ok(Detalle(c, id));
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "admin")]
    public IActionResult Eliminar(long id)
    {
        using var c = db.Open();
        if (c.ExecuteScalar<long?>("SELECT 1 FROM cursos WHERE id = @id", new { id }) is null)
            return NotFound(new { message = "Recurso no encontrado." });
        if (c.ExecuteScalar<long?>("SELECT 1 FROM matriculas WHERE curso_id = @id", new { id }) is not null)
            return Conflict(new { message = "No se puede eliminar el curso porque tiene estudiantes matriculados.", rule_code = "curso_con_matriculas_activas" });

        using var tx = c.BeginTransaction();
        c.Execute("DELETE FROM curso_categoria WHERE curso_id = @id", new { id }, tx);
        c.Execute("DELETE FROM cursos WHERE id = @id", new { id }, tx);
        tx.Commit();
        return NoContent();
    }
}
