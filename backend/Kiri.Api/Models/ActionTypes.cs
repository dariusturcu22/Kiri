namespace Kiri.Api.Models;

public static class ActionTypes
{
    public const string Login = "LOGIN";
    public const string LoginFailed = "LOGIN_FAILED";
    public const string Logout = "LOGOUT";
    public const string Register = "REGISTER";
    public const string CreateProperty = "CREATE_PROPERTY";
    public const string UpdateProperty = "UPDATE_PROPERTY";
    public const string DeleteProperty = "DELETE_PROPERTY";
    public const string CreateTenant = "CREATE_TENANT";
    public const string UpdateTenant = "UPDATE_TENANT";
    public const string DeleteTenant = "DELETE_TENANT";
    public const string UnauthorizedAccess = "UNAUTHORIZED_ACCESS";
}
