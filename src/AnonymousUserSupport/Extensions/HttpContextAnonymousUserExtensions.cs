using Microsoft.AspNetCore.Http;

namespace eShop.AnonymousUserSupport.Extensions;

public static class HttpContextAnonymousUserExtensions
{
    public  const string         ANONYMOUS_USER_ID_KEY =   "active-anonymous-user-id";
    private const string STASHED_ANONYMOUS_USER_ID_KEY = "inactive-anonymous-user-id";

    const string PREFIX = "anon";

    /// <summary>
    /// Client-side anonymous ID accessor
    /// </summary>
    public static string? GetAnonymousUserIdFromCookie(this HttpContext context) => context.Request.Cookies[ANONYMOUS_USER_ID_KEY        ]?.ToString() ?? context.GetAnonymousUserIdFromResponseSetCookie();

    /// <summary>
    /// Server-side anonymous ID accessor
    /// </summary>
    public static string? GetAnonymousUserIdFromHeader(this HttpContext context) => context.Request.Headers[ANONYMOUS_USER_ID_KEY        ] .ToString();
    public static string? GetAnonymousUserIdFromStash(this HttpContext context) => context.Request.Cookies[STASHED_ANONYMOUS_USER_ID_KEY]?.ToString();

    /// <summary>
    /// Returns the anonymous ID value from the <b>Response</b> "Set-Cookie" header. This allows you to detect 
    /// the anonymous ID earlier (right after a user signs out), before the anonymous ID is added to a cookie.
    /// </summary>
    private static string? GetAnonymousUserIdFromResponseSetCookie(this HttpContext context)
    {
        try
        {
            return context.Response.Headers["Set-Cookie"].ToString()
                        .Split(new[]{ANONYMOUS_USER_ID_KEY, "=", ";"}, StringSplitOptions.RemoveEmptyEntries)[0];
        }
        catch(Exception) {}

        return null;
    }

    public static string SetAnonymousUserIdCookie(this HttpContext context, ILogger? logger = null)
    {
        string anonymousUserId = GetAnonymousUserIdFromStash(context) ?? string.Join('-', PREFIX, Guid.NewGuid().ToString());

        try {
            context.Response.Cookies.Append(
                ANONYMOUS_USER_ID_KEY, 
                anonymousUserId, 
                new CookieOptions {
                    Expires = DateTime.Now.AddDays(14)
                }
            );
            logger?.LogDebug($"Set the anonymous user ID cookie: key {ANONYMOUS_USER_ID_KEY}, value {anonymousUserId}");
        }
        catch (InvalidOperationException)
        {
            logger?.LogError("Could not create the anonymous user ID.");

            if( true == logger?.IsEnabled(LogLevel.Debug) )
                logger.LogDebug($"Could not set the anonymous user ID cookie: key {ANONYMOUS_USER_ID_KEY}, value {anonymousUserId}");
        }

        return anonymousUserId;
    }

    private static void StashAnonymousUserId(this HttpContext context, ILogger? logger = null)
    {
        string? anonymousUserId = GetAnonymousUserIdFromCookie(context);

        if( string.IsNullOrEmpty(anonymousUserId) ) anonymousUserId = null;

        try
        {
            context.Response.Cookies.Append(
                STASHED_ANONYMOUS_USER_ID_KEY, 
                anonymousUserId, 
                new CookieOptions {
                    Expires = DateTime.Now.AddDays(14)
                }
            );
        }
        catch (InvalidOperationException)
        {
            logger?.LogError("Could not stash the anonymous user ID.");

            if( true == logger?.IsEnabled(LogLevel.Debug) )
                logger.LogDebug($"Could not create the stashed anonymous user ID cookie: key {STASHED_ANONYMOUS_USER_ID_KEY}");
        }
        logger?.LogDebug($"Stashed the anonymous user ID cookie: key {STASHED_ANONYMOUS_USER_ID_KEY}, value {anonymousUserId}");
    }

    public static void DeleteAnonymousUserIdCooke(this HttpContext context, ILogger? logger = null)
    {
        string? anonymousUserId = context.GetAnonymousUserIdFromCookie();

        //if( false == context.Response.HasStarted ) return;        // if response has started, then there will be an InvalidOperationException

        try
        {
            context.Response.Cookies.Append(
                ANONYMOUS_USER_ID_KEY, 
                anonymousUserId, 
                new CookieOptions {
                    Expires = DateTime.Now.AddDays(-1)
                }
            );

            if( anonymousUserId is not null) StashAnonymousUserId(context);
        }
        catch (InvalidOperationException)
        {
            logger?.LogError("Could not delete the anonymous user ID.");

            if( true == logger?.IsEnabled(LogLevel.Debug) )
                logger.LogDebug($"Could not delete the anonymous user ID cookie: key {ANONYMOUS_USER_ID_KEY}, value {anonymousUserId}");
        }
        logger?.LogDebug($"Deleted the anonymous user ID cookie: key {ANONYMOUS_USER_ID_KEY}, value {anonymousUserId}");
    }
}
