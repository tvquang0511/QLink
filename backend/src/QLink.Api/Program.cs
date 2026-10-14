using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using QLink.Api.Data;
using QLink.Api.Middlewares;
using QLink.Api.Services;
using QLink.Api.Services.Common;

var builder = WebApplication.CreateBuilder(args);

// 1. Cấu hình Database & Entity Framework Core (PostgreSQL)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=qlink_db;Username=qlink;Password=qlink_dev_pass;";

builder.Services.AddDbContext<QLinkDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

// 2. Đăng ký Services & Dependency Injection (DI)
builder.Services.AddSingleton<ICodeGenerator, Base62CodeGenerator>();
builder.Services.AddScoped<ILinkService, LinkService>();
builder.Services.AddScoped<IStatsService, StatsService>();

// 3. Controllers, Problem Details & OpenAPI
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();

// 4. Cấu hình CORS cho Next.js Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            {
                var host = new Uri(origin).Host;
                return host == "localhost" || host == "127.0.0.1";
            })
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// 5. Khởi tạo Database tự động (EnsureCreated) phục vụ MVP chạy ngay lập tức
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<QLinkDbContext>();
        logger.LogInformation("Checking and preparing PostgreSQL database...");
        db.Database.EnsureCreated();
        logger.LogInformation("Database is ready with tables 'links' and 'click_events'.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Could not connect to PostgreSQL on startup. Please ensure Docker/Postgres is running.");
    }
}

// 6. HTTP Pipeline Middlewares
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.Title = "QLink API Documentation";
        options.Theme = ScalarTheme.Purple;
    });
}

app.UseStatusCodePages();
app.UseCors("FrontendPolicy");
app.UseAuthorization();

// 7. Health Check
app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    service = "QLink.Api",
    version = "1.0.0-mvp",
    timestamp = DateTime.UtcNow
}));

app.MapControllers();

app.Run();
