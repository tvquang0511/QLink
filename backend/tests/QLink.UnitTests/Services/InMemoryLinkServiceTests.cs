using QLink.Api.Contracts.Requests;
using QLink.Api.Services;

namespace QLink.UnitTests.Services;

public class InMemoryLinkServiceTests
{
    private readonly InMemoryLinkService _sut; // System Under Test
    private const string BaseUrl = "http://localhost:5102";

    public InMemoryLinkServiceTests()
    {
        _sut = new InMemoryLinkService();
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
    }

    [Fact]
    public async Task GetOriginalUrlAndRecordClickAsync_ShouldIncrementClickCount()
    {
        // Arrange
        var request = new CreateLinkRequest(
            OriginalUrl: "https://learn.microsoft.com/aspnet/core"
        );
        var created = await _sut.CreateAsync(request, BaseUrl);

        // Act
        var originalUrl = await _sut.GetOriginalUrlAndRecordClickAsync(created.Code);
        var fetched = await _sut.GetByCodeAsync(created.Code, BaseUrl);

        // Assert
        Assert.Equal(request.OriginalUrl, originalUrl);
        Assert.NotNull(fetched);
        Assert.Equal(1, fetched.ClickCount);
    }
}
