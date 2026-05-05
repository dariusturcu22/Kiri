FROM mcr.microsoft.com/dotnet/runtime:10.0 AS base
USER $APP_UID
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["Kiri.Api.Tests/Kiri.Api.Tests.csproj", "Kiri.Api.Tests/"]
COPY ["Kiri.Api/Kiri.Api.csproj", "Kiri.Api/"]
RUN dotnet restore "Kiri.Api.Tests/Kiri.Api.Tests.csproj"
COPY . .
WORKDIR "/src/Kiri.Api.Tests"
RUN dotnet build "./Kiri.Api.Tests.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Kiri.Api.Tests.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Kiri.Api.Tests.dll"]
