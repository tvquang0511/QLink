using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace QLink.Api.Middlewares;

/// <summary>
/// Middleware bắt mọi ngoại lệ chưa được xử lý (Unhandled Exceptions) trên toàn hệ thống.
/// Đóng gói thành định dạng chuẩn RFC 7807 (ProblemDetails) giúp frontend dễ dàng hiển thị.
/// </summary>
public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        var problem = new ProblemDetails
        {
            Status = context.Response.StatusCode,
            Title = "Internal Server Error",
            Detail = "Đã xảy ra lỗi nội bộ máy chủ. Vui lòng thử lại sau.",
            Instance = context.Request.Path
        };

        var json = JsonSerializer.Serialize(problem);
        return context.Response.WriteAsync(json);
    }
}
