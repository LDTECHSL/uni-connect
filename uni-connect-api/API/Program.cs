using System.Text;
using Application;
using Infrastructure;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

ConfigurationManager configuration = builder.Configuration;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "[jwt:issuer]",
            ValidAudience = "[jwt:audience]",
            IssuerSigningKey =
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes("your-32-characters-long-secret-key-here"))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
var connectionString = builder.Configuration.GetConnectionString("CoreConnection");
builder.Services.AddDbContext<CoreDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

builder.Services.AddHttpContextAccessor();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(configuration);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseCors(options =>
{
    options
        .AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader();
});
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();