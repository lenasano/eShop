namespace eShop.AnonymousUserSupport;
public class ServerHeaderInterceptor : Interceptor
{
    private readonly ILogger<ServerHeaderInterceptor> _logger;

    public ServerHeaderInterceptor(ILogger<ServerHeaderInterceptor> logger)
    {
        _logger = logger;
    }

    /// <remarks>
    /// Intercepts a request that is received by a server (but before forwarding to the request handler).
    /// </remarks>
    public override async Task<TResponse> UnaryServerHandler<TRequest, TResponse>(
        TRequest request,
        ServerCallContext context,
        UnaryServerMethod<TRequest, TResponse> continuation)
    {
        
        const string KEY = "anonymous-user-id";

        string? clientHeaderValue = context.RequestHeaders.GetValue(KEY);
        _logger.LogDebug($"anonUId, received custom client header << {KEY}:{clientHeaderValue}"); // shows up in basket-api logs

        /*/ Add a custom header to the response

        Results in the error:
            Grpc.AspNetCore.Server.ServerCallHandler[6] Error when executing service method. System.InvalidOperationException: Headers are read-only, response has already started. */

        await context.WriteResponseHeadersAsync(new Metadata
        {
            { "custom-server-header", "server-value" }
        });

        var response = await continuation(request, context);
        return response;
    }
}