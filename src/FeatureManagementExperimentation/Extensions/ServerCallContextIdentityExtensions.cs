#nullable enable

using eShop.AnonymousUserSupport.Extensions;

namespace FeatureManagementExperimentation.Extensions;

internal static class ServerCallContextIdentityExtensions
{
    /// <summary>
    /// Get ID of logged in user or anonymous user
    /// </summary>
    /// <remarks>
    /// Gets logged in user's ID from ASP.NET Core Identity. If the user is not logged in, the anonymous user ID (sent from the client) is retrieved from the HTTP header.
    /// </remarks>
    /// <returns>User ID</returns>
    public static string? GetUserIdentity(this ServerCallContext context)
    {
        HttpContext hc = context.GetHttpContext();
        return hc.User.FindFirst("sub")?.Value ?? hc.GetAnonymousUserIdFromHeader();
    }
}
