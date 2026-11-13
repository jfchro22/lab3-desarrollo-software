using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Comparativo.Api;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

var secreto = builder.Configuration["JWT_SECRET"] ?? Program.SecretoPorDefecto;
builder.Services.AddSingleton(new Db(builder.Configuration["DB_PATH"] ?? "../datos/base.sqlite"));

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower)
    .ConfigureApiBehaviorOptions(o => o.InvalidModelStateResponseFactory = ctx =>
    {
        // 422 con el formato común del contrato: { message, errors: { campo: [mensajes] } }
        var errors = ctx.ModelState.Where(e => e.Value!.Errors.Count > 0).ToDictionary(
            e => Regex.Replace(e.Key.Replace("$.", ""), "(?<!^)([A-Z])", "_$1").ToLowerInvariant(),
            e => e.Value!.Errors.Select(x => string.IsNullOrEmpty(x.ErrorMessage) ? "Valor no válido." : x.ErrorMessage).ToArray());
        return new ObjectResult(new { message = "Los datos proporcionados no son válidos.", errors }) { StatusCode = 422 };
    });

// [auth:inicio]
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
{
    o.MapInboundClaims = false;
    o.TokenValidationParameters = new TokenValidationParameters
    {
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secreto)),
        ValidateIssuer = false,
        ValidateAudience = false,
        RoleClaimType = "role",
        NameClaimType = "sub",
    };
    o.Events = new JwtBearerEvents
    {
        OnChallenge = async ctx =>
        {
            ctx.HandleResponse();
            ctx.Response.StatusCode = 401;
            ctx.Response.ContentType = "application/json";
            await ctx.Response.WriteAsync("{\"message\":\"No autenticado.\"}");
        },
        OnForbidden = async ctx =>
        {
            ctx.Response.StatusCode = 403;
            ctx.Response.ContentType = "application/json";
            await ctx.Response.WriteAsync("{\"message\":\"No tiene permisos para realizar esta acción.\"}");
        },
    };
});
builder.Services.AddAuthorization();
// [auth:fin]

// [docs:inicio]
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Comparativo - ASP.NET Core", Version = "1.0" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT" });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() },
    });
});

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
// [docs:fin]
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

public partial class Program
{
    public const string SecretoPorDefecto = "cambiar-en-produccion-comparativo";
}
