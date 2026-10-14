using Scalar.AspNetCore;
using QLink.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Đăng ký Controllers & Problem Details (RFC 7807)
builder.Services.AddControllers();
builder.Services.AddProblemDetails();

// 2. Cấu hình OpenAPI documentation
builder.Services.AddOpenApi();

// 3. Cấu hình CORS để Next.js Frontend (port 3000) có thể gọi API mà không bị chặn
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://127.0.0.1:3000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// 4. Đăng ký Dependency Injection (DI)
// Giai đoạn 1: Dùng InMemoryLinkService dạng Singleton (để giữ state bộ nhớ phục vụ test)
// Giai đoạn 2: Bạn sẽ đổi thành builder.Services.AddScoped<ILinkService, EfCoreLinkService>()
builder.Services.AddSingleton<ILinkService, InMemoryLinkService>();

var app = builder.Build();

// 5. Cấu hình HTTP Request Pipeline (Middleware)
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.Title = "QLink API Documentation";
        options.Theme = ScalarTheme.Purple;
    });
}

// Bật Problem Details middleware để tự động format exception chuẩn RFC 7807
app.UseStatusCodePages();

// Sử dụng CORS đã cấu hình
app.UseCors("FrontendPolicy");

app.UseAuthorization();

// 6. Endpoint Health Check tiện dụng cho Docker/K8s/Frontend kiểm tra
app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    service = "QLink.Api",
    version = "1.0.0",
    timestamp = DateTime.UtcNow
}));

app.MapControllers();

app.Run();
