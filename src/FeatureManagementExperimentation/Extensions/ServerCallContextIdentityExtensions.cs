#nullable enable

using eShop.AnonymousUserSupport.Extensions;
using Splitio.Domain;

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

    /// <summary>
    /// Get ID of logged in user or anonymous user as a <c>Splitio.Domain.Key</c> object
    /// </summary>
    /// <remarks>
    /// Gets logged in user's ID from ASP.NET Core Identity. If the user is not logged in, the anonymous user ID (sent from the client) is retrieved from the HTTP header. The anonymous user ID is always used as the bucketing key.
    /// </remarks>
    /// <returns>
    ///     A <c>Splitio.Domain.Key</c> values as follows:
    ///     - matching key - user ID or anonymous ID
    ///     - bucketing key - anonymous ID
    /// </returns>
    public static Key GetUserIdentityAndBucketingKey(this ServerCallContext context)
    {
        HttpContext hc = context.GetHttpContext();
        string? anonymousId = hc.GetAnonymousUserIdFromHeader();

        return new Key(
            hc.User.FindFirst("sub")?.Value ?? anonymousId,
            anonymousId?.Trim() == "" ? null : anonymousId      // set bucketing key to null if it is an empty string
        );
    }
}
