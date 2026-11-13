using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace Comparativo.Api;

public class LoginDto
{
    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "El correo no es válido.")]
    public string? Email { get; set; }

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    public string? Password { get; set; }
}

public class CrearCursoDto
{
    [Required(ErrorMessage = "El nombre del curso es obligatorio.")]
    [StringLength(150, MinimumLength = 3, ErrorMessage = "El nombre del curso debe tener entre 3 y 150 caracteres.")]
    public string? Nombre { get; set; }

    [Required(ErrorMessage = "Los créditos son obligatorios.")]
    [Range(1, 6, ErrorMessage = "Los créditos deben estar entre 1 y 6.")]
    public int? Creditos { get; set; }

    [Required(ErrorMessage = "Debe indicar el profesor que imparte el curso.")]
    public int? ProfesorId { get; set; }

    [Required(ErrorMessage = "Debe asignar al menos una categoría al curso.")]
    [MinLength(1, ErrorMessage = "Debe asignar al menos una categoría al curso.")]
    public List<int>? CategoriaIds { get; set; }
}

public class ActualizarCursoDto
{
    [StringLength(150, MinimumLength = 3, ErrorMessage = "El nombre del curso debe tener entre 3 y 150 caracteres.")]
    public string? Nombre { get; set; }

    [Range(1, 6, ErrorMessage = "Los créditos deben estar entre 1 y 6.")]
    public int? Creditos { get; set; }

    public int? ProfesorId { get; set; }

    [MinLength(1, ErrorMessage = "Debe asignar al menos una categoría al curso.")]
    public List<int>? CategoriaIds { get; set; }
}

public class ListarQuery
{
    [Range(1, int.MaxValue, ErrorMessage = "page debe ser al menos 1.")]
    public int? Page { get; set; }

    [FromQuery(Name = "per_page")]
    [Range(1, 50, ErrorMessage = "El parámetro per_page debe estar entre 1 y 50.")]
    public int? PerPage { get; set; }

    [StringLength(150)]
    public string? Nombre { get; set; }
}

public class UsuarioRow
{
    public long Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public string Role { get; set; } = "";
}

public class CursoRow
{
    public long Id { get; set; }
    public string Nombre { get; set; } = "";
    public long Creditos { get; set; }
    public long ProfesorId { get; set; }
}
