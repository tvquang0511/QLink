# 1. Build Stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore
COPY ["src/QLink.Api/QLink.Api.csproj", "src/QLink.Api/"]
RUN dotnet restore "src/QLink.Api/QLink.Api.csproj"

# Copy full source and publish
COPY ["src/QLink.Api/", "src/QLink.Api/"]
WORKDIR "/src/src/QLink.Api"
RUN dotnet publish "QLink.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 5102
ENV ASPNETCORE_URLS=http://+:5102
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "QLink.Api.dll"]
