using QLink.Api.Contracts.Requests;
using QLink.Api.Services;
using QLink.Api.Services.Common;

namespace QLink.UnitTests.Services;

public class InMemoryLinkServiceTests
{
    private readonly InMemoryLinkService _sut; // System Under Test
    private const string BaseUrl = "http://localhost:5102";

    public InMemoryLinkServiceTests()
    {
        _sut = new InMemoryLinkService(new Base62CodeGenerator());
    }

    [Fact]
    public async Task CreateAsync_ShouldGenerateValidCodeAndReturnResponse()
    {
        // Arrange
        var request = new CreateLinkRequest(
            OriginalUrl: "https://github.com/dotnet/aspnetcore",
            Title: "ASP.NET Core Repository",
            Campaign: "test"
        );

        // Act
        var result = await _sut.CreateAsync(request, BaseUrl);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result.Code);
        Assert.Equal(7, result.Code.Length);
        Assert.Equal(request.OriginalUrl, result.OriginalUrl);
        Assert.Equal($"{BaseUrl}/{result.Code}", result.ShortUrl);
        Assert.True(result.IsActive);
        Assert.Equal(0, result.ClickCount);
        Assert.Equal(0, result.ClicksToday);
    }

    [Fact]
    public async Task RecordClickAndGetRedirectUrlAsync_ShouldIncrementClickCount()
    {
        // Arrange
        var request = new CreateLinkRequest(
            OriginalUrl: "https://learn.microsoft.com/aspnet/core"
        );
        var created = await _sut.CreateAsync(request, BaseUrl);

        // Act
        var originalUrl = await _sut.RecordClickAndGetRedirectUrlAsync(
            created.Code,
            referer: "https://google.com",
            userAgent: "Mozilla/5.0",
            ipAddress: "127.0.0.1"
        );
        var fetched = await _sut.GetByCodeAsync(created.Code, BaseUrl);

        // Assert
        Assert.Equal(request.OriginalUrl, originalUrl);
        Assert.NotNull(fetched);
        Assert.Equal(1, fetched.ClickCount);
        Assert.Equal(1, fetched.ClicksToday);
    }

    [Fact]
    public async Task CreateAsync_WithCustomCode_ShouldUseCustomCode()
    {
        // Arrange
        var request = new CreateLinkRequest(
            OriginalUrl: "https://facebook.com/tvquang0511",
            CustomCode: "fb"
        );

        // Act
        var result = await _sut.CreateAsync(request, BaseUrl);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("fb", result.Code);
        Assert.Equal($"{BaseUrl}/fb", result.ShortUrl);
    }

    [Fact]
    public async Task CreateAsync_WithDuplicateCustomCode_ShouldThrowException()
    {
        // Arrange
        var request1 = new CreateLinkRequest(OriginalUrl: "https://example.com/1", CustomCode: "portfolio");
        var request2 = new CreateLinkRequest(OriginalUrl: "https://example.com/2", CustomCode: "portfolio");

        // Act
        await _sut.CreateAsync(request1, BaseUrl);

        // Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.CreateAsync(request2, BaseUrl));
    }
}
