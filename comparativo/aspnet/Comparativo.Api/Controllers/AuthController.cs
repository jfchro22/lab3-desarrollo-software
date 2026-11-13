using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace Comparativo.Api.Controllers;

[ApiController]
[Route("api/login")]
[Tags("Autenticación")]
public class AuthController(Db db, IConfiguration cfg) : ControllerBase
{
    [HttpPost]
    public IActionResult Login(LoginDto dto)
    {
        using var c = db.Open();
        var u = c.QueryFirstOrDefault<UsuarioRow>(
            "SELECT id AS Id, name AS Name, email AS Email, password AS Password, role AS Role FROM users WHERE email = @e",
            new { e = dto.Email });
        if (u is null || !BCrypt.Net.BCrypt.Verify(dto.Password, u.Password))
            return Unauthorized(new { message = "Credenciales incorrectas." });

        var expira = DateTime.UtcNow.AddHours(2);
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["JWT_SECRET"] ?? Program.SecretoPorDefecto));
        var jwt = new JwtSecurityToken(
            claims: new[] { new Claim("sub", u.Id.ToString()), new Claim("role", u.Role) },
            expires: expira,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        return Ok(new
        {
            usuario = new { id = u.Id, name = u.Name, email = u.Email, role = u.Role },
            token = new JwtSecurityTokenHandler().WriteToken(jwt),
            expira_en = expira.ToString("o"),
        });
    }
}
