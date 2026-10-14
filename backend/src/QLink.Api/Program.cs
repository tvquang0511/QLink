using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using QLink.Api.Data;
using QLink.Api.Middlewares;
using QLink.Api.Services;
using QLink.Api.Services.Common;

// 1. Tự động đọc file .env nếu có (Hỗ trợ cấu hình Supabase / biến môi trường local)
LoadEnvFile(".env");
LoadEnvFile(Path.Combine(AppContext.BaseDirectory, ".env"));
LoadEnvFile(Path.Combine(Directory.GetCurrentDirectory(), ".env"));
LoadEnvFile(Path.Combine(Directory.GetCurrentDirectory(), "../../.env"));

var builder = WebApplication.CreateBuilder(args);

// 2. Cấu hình Database & Entity Framework Core (PostgreSQL / Supabase)
var rawConnection = Environment.GetEnvironmentVariable("DIRECT_URL")
    ?? Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? (string.IsNullOrWhiteSpace(builder.Configuration.GetConnectionString("DefaultConnection")) ? null : builder.Configuration.GetConnectionString("DefaultConnection"))
    ?? "Host=localhost;Port=5432;Database=qlink_db;Username=qlink;Password=qlink_dev_pass;";

var connectionString = ParseConnectionString(rawConnection);

builder.Services.AddDbContext<QLinkDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

// 3. Đăng ký Services & Dependency Injection (DI)
builder.Services.AddSingleton<ICodeGenerator, Base62CodeGenerator>();
builder.Services.AddScoped<ILinkService, LinkService>();
builder.Services.AddScoped<IStatsService, StatsService>();

// 4. Controllers, Problem Details & OpenAPI
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();

// 5. Cấu hình CORS (Cho phép mọi origin: localhost, Vercel, và Custom Domain như qlink.tvquang.id.vn)
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.SetIsOriginAllowed(_ => true) // Cho phép tất cả domain gọi API mà không bị chặn
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// 6. Khởi tạo Database tự động (EnsureCreated) phục vụ MVP chạy ngay lập tức
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
        logger.LogWarning(ex, "Could not connect to PostgreSQL on startup. Please verify your connection string in .env");
    }
}

// 7. HTTP Pipeline Middlewares
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

// Bật Scalar API Docs trên cả Development và Production để bạn dễ dàng test trên Railway
app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options.Title = "QLink API Documentation";
    options.Theme = ScalarTheme.Purple;
});

app.UseStatusCodePages();
app.UseRouting();
app.UseCors("FrontendPolicy");
app.UseAuthorization();

// 8. Health Check
app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    service = "QLink.Api",
    version = "1.0.0-mvp",
    timestamp = DateTime.UtcNow
})).RequireCors("FrontendPolicy");

app.MapControllers().RequireCors("FrontendPolicy");

// 9. Lắng nghe theo PORT động của Railway nếu có
var railwayPort = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(railwayPort))
{
    app.Run($"http://0.0.0.0:{railwayPort}");
}
else
{
    app.Run();
}

// Helper Functions
static void LoadEnvFile(string path)
{
    if (!File.Exists(path)) return;
    foreach (var line in File.ReadAllLines(path))
    {
        var trimmed = line.Trim();
        if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith("#")) continue;
        var parts = trimmed.Split('=', 2);
        if (parts.Length == 2)
        {
            var key = parts[0].Trim();
            var val = parts[1].Trim().Trim('"').Trim('\'');
            if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
            {
                Environment.SetEnvironmentVariable(key, val);
            }
        }
    }
}

static string ParseConnectionString(string input)
{
    if (string.IsNullOrWhiteSpace(input)) return input;

    // Hỗ trợ cả định dạng postgresql:// URI từ Supabase và chuyển đổi sang chuẩn Npgsql
    if (input.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) ||
        input.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
    {
        try
        {
            var uri = new Uri(input);
            var userInfo = uri.UserInfo.Split(':');
            var user = Uri.UnescapeDataString(userInfo[0]);
            var pass = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
            var port = uri.Port > 0 ? uri.Port : 5432;
            var db = uri.AbsolutePath.TrimStart('/');
            if (string.IsNullOrEmpty(db)) db = "postgres";

            return $"Host={uri.Host};Port={port};Database={db};Username={user};Password={pass};Pooling=true;SSL Mode=Require;Trust Server Certificate=true;";
        }
        catch
        {
            return input;
        }
    }

    return input;
}
