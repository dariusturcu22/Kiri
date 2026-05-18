using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Kiri.Api.Models;

namespace Kiri.Api.Tests.Auth;

public sealed class AuthEndpointsTests : IAsyncLifetime
{
    private readonly AuthWebApplicationFactory _factory = new();
    private HttpClient _client = null!;

    public async Task InitializeAsync()
    {
        await _factory.SeedRolesAsync();
        _client = _factory.CreateClient(new()
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
        });
    }

    public Task DisposeAsync()
    {
        _client.Dispose();
        _factory.Dispose();
        return Task.CompletedTask;
    }

    // ── REGISTER ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_WithValidLandlordData_Returns201AndSetsTokenCookie()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "landlord@test.com",
            password = "Test123!",
            confirmPassword = "Test123!",
            firstName = "Ion",
            lastName = "Popescu",
            role = "Landlord"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Should().ContainKey("Set-Cookie");
        response.Headers.GetValues("Set-Cookie")
            .Should().Contain(c => c.StartsWith("kiri_token="));
    }

    [Fact]
    public async Task Register_WithValidTenantData_Returns201()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "tenant@test.com",
            password = "Test123!",
            confirmPassword = "Test123!",
            firstName = "Maria",
            lastName = "Ionescu",
            role = "Tenant"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_Returns409()
    {
        var body = new
        {
            email = "dup@test.com",
            password = "Test123!",
            confirmPassword = "Test123!",
            firstName = "A",
            lastName = "B",
            role = "Landlord"
        };

        await _client.PostAsJsonAsync("/api/auth/register", body);
        var response = await _client.PostAsJsonAsync("/api/auth/register", body);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Register_WithMismatchedPasswords_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "mismatch@test.com",
            password = "Test123!",
            confirmPassword = "Different123!",
            firstName = "A",
            lastName = "B",
            role = "Landlord"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_WithShortPassword_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "short@test.com",
            password = "abc",
            confirmPassword = "abc",
            firstName = "A",
            lastName = "B",
            role = "Landlord"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_WithInvalidRole_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "badrole@test.com",
            password = "Test123!",
            confirmPassword = "Test123!",
            firstName = "A",
            lastName = "B",
            role = "Admin"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_WithMissingFields_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "",
            password = "Test123!",
            confirmPassword = "Test123!",
            firstName = "",
            lastName = "",
            role = "Landlord"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── LOGIN ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_WithValidCredentials_Returns200AndSetsTokenCookie()
    {
        await _client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "login_valid@test.com",
            password = "Test123!",
            confirmPassword = "Test123!",
            firstName = "A",
            lastName = "B",
            role = "Landlord"
        });

        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "login_valid@test.com",
            password = "Test123!"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.Should().ContainKey("Set-Cookie");
        response.Headers.GetValues("Set-Cookie")
            .Should().Contain(c => c.StartsWith("kiri_token="));
    }

    [Fact]
    public async Task Login_WithWrongPassword_Returns401()
    {
        await _client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "login_wrong@test.com",
            password = "Test123!",
            confirmPassword = "Test123!",
            firstName = "A",
            lastName = "B",
            role = "Landlord"
        });

        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "login_wrong@test.com",
            password = "WrongPassword!"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_WithUnknownEmail_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "nobody@test.com",
            password = "Test123!"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_WithMissingCredentials_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "",
            password = ""
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── ME ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Me_AfterLogin_ReturnsUserData()
    {
        await _client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "me@test.com",
            password = "Test123!",
            confirmPassword = "Test123!",
            firstName = "Test",
            lastName = "User",
            role = "Landlord"
        });

        var meResponse = await _client.GetAsync("/api/auth/me");
        meResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var user = await meResponse.Content.ReadFromJsonAsync<UserResponse>(options);
        user.Should().NotBeNull();
        user!.Email.Should().Be("me@test.com");
        user.Role.Should().Be("Landlord");
    }

    [Fact]
    public async Task Me_WithoutToken_Returns401()
    {
        var freshClient = _factory.CreateClient();
        var response = await freshClient.GetAsync("/api/auth/me");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── LOGOUT ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Logout_AfterLogin_ClearsTokenCookie()
    {
        await _client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "logout@test.com",
            password = "Test123!",
            confirmPassword = "Test123!",
            firstName = "A",
            lastName = "B",
            role = "Landlord"
        });

        var logoutResponse = await _client.PostAsync("/api/auth/logout", null);
        logoutResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var meResponse = await _client.GetAsync("/api/auth/me");
        meResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
