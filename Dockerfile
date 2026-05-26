# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend/Kiri.Api/Kiri.Api.csproj backend/Kiri.Api/
RUN dotnet restore backend/Kiri.Api/Kiri.Api.csproj

COPY backend/Kiri.Api/ backend/Kiri.Api/
WORKDIR /src/backend/Kiri.Api
RUN dotnet publish Kiri.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Kiri.Api.dll"]
