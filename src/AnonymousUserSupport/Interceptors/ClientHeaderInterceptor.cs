using eShop.AnonymousUserSupport.Extensions;
using Microsoft.AspNetCore.Http;
using AnonymousSupport = eShop.AnonymousUserSupport.Extensions.HttpContextAnonymousUserExtensions;

namespace eShop.AnonymousUserSupport;
public class ClientHeaderInterceptor : Interceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<ServerHeaderInterceptor> _logger;

    public ClientHeaderInterceptor(
        IHttpContextAccessor httpContextAccessor,
        ILogger<ServerHeaderInterceptor> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }


    /// <remarks>
    /// This intercepter intercepts a request just as it leaves the client (before it is sent to the server).
    /// </remarks>
    public override AsyncUnaryCall<TResponse> AsyncUnaryCall<TRequest, TResponse>(
        TRequest request,
        ClientInterceptorContext<TRequest, TResponse> context,
        AsyncUnaryCallContinuation<TRequest, TResponse> continuation)
    {
        var headers = context.Options.Headers ?? new Metadata();
        
        string? headerValue = _httpContextAccessor.HttpContext.GetAnonymousUserIdFromCookie();
        const string HEADER_KEY = AnonymousSupport.ANONYMOUS_USER_ID_KEY;
        
        if(headerValue is not null) headers.Add(HEADER_KEY, headerValue);


        var newOptions = context.Options.WithHeaders(headers);  // add the key-value to the HTTP headers
        context = new ClientInterceptorContext<TRequest, TResponse>(context.Method, context.Host, newOptions);

        
        _logger.LogDebug($"anonUId, sending custom client header >> {HEADER_KEY}:{headerValue}"); // shows up in webapp logs

        // You can also read response headers here after the call completes
        // The result of the continuation is an AsyncUnaryCall
        var call = continuation(request, context);

        // Accessing response headers after the call
        // var responseHeaders = await call.ResponseHeadersAsync;
        // var serverHeaderValue = responseHeaders.GetValue("custom-server-header");

        return call;
    }
}