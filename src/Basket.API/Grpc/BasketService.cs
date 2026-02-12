using System.Diagnostics.CodeAnalysis;
using eShop.Basket.API.Repositories;
using eShop.Basket.API.Extensions;
using eShop.Basket.API.Model;
using eShop.AnonymousUserSupport.Extensions;

namespace eShop.Basket.API.Grpc;

public class BasketService(
    IBasketRepository repository,
    ILogger<BasketService> logger) : Basket.BasketBase
{
    [AllowAnonymous]
    public override async Task<CustomerBasketResponse> GetBasket(GetBasketRequest request, ServerCallContext context)
    {
        var userId = context.GetUserIdentity();

        if (logger.IsEnabled(LogLevel.Debug))
        {
            string headervalue = context.GetHttpContext().Request.Headers[HttpContextAnonymousUserExtensions.ANONYMOUS_USER_ID_KEY];

            logger.LogDebug(
                $"anonUId, begin {context.Method}, this should change when Bob signs in: \n serverCallContext user name {context.GetUserName()}, id {context.GetHttpContext().User.FindFirst("sub")?.Value} \n Is user authenticated? {context.GetHttpContext().User.Identity?.IsAuthenticated}. \n Header value: {headervalue}"
            );
        }

        var data = await repository.GetBasketAsync(userId);

        if (data is not null)
        {
            return MapToCustomerBasketResponse(data);
        }

        return new();
    }

    [AllowAnonymous]
    public override async Task<CustomerBasketResponse> UpdateBasket(UpdateBasketRequest request, ServerCallContext context)
    {
        var userId = context.GetUserIdentity();
        if (string.IsNullOrEmpty(userId))
        {
            ThrowNotAuthenticated();
        }

        if (logger.IsEnabled(LogLevel.Debug))
        {
            logger.LogDebug("Begin UpdateBasket call from method {Method} for user id {Id}", context.Method, userId);
        }

        var customerBasket = MapToCustomerBasket(userId, request);
        var response = await repository.UpdateBasketAsync(customerBasket);
        if (response is null)
        {
            ThrowBasketDoesNotExist(userId);
        }

        return MapToCustomerBasketResponse(response);
    }

    /// <summary>
    /// Call this function when an anonymous user signs in to copy basket items into the signed in user's basket.
    /// </summary>
    /// <see cref="UpdateBasket"/>
    // <remarks>Relies on the anonymous user ID to be present in gRPC Metadata (header). Anonymous user ID should be inserted by the (gRPC request) interceptor.</remarks>
    public override async Task<CustomerBasketResponse> AddAnonymousBasketItems(AddAnonymousBasketItemsRequest request, ServerCallContext context)
    {
        string userId = context.GetUserIdentity();
        
        string anonymousUserId = context.GetHttpContext().GetAnonymousUserIdFromHeader();

        if (string.IsNullOrEmpty(userId) || userId.Equals(anonymousUserId))
        {
            ThrowNotAuthenticated();
        }

        if (string.IsNullOrEmpty(anonymousUserId))
        {
            var data = await repository.GetBasketAsync(userId);

            if (data is not null)
            {
                return MapToCustomerBasketResponse(data);
            }

            return new();
        }

        if (logger.IsEnabled(LogLevel.Debug))
        {
            logger.LogDebug(
                $"anonBasket, begin {context.Method}, copying over the anon items! : \n serverCallContext user name {context.GetUserName()}, id {context.GetHttpContext().User.FindFirst("sub")?.Value} \n Is user authenticated? {context.GetHttpContext().User.Identity?.IsAuthenticated}. \n Header value: {anonymousUserId}"
            );
        }

        CustomerBasket loggedInUsersBasket  = await repository.GetBasketAsync(userId)          ?? new CustomerBasket();
        CustomerBasket anonymousUsersBasket = await repository.GetBasketAsync(anonymousUserId) ?? new CustomerBasket();

        loggedInUsersBasket.BuyerId = userId;
        
        foreach( Model.BasketItem anonymousItem in anonymousUsersBasket.Items.ToList() )
        {
            Model.BasketItem loggedItem = loggedInUsersBasket.Items.Find(i => i.ProductId == anonymousItem.ProductId);
            if( null != loggedItem )
            {
                loggedItem.Quantity += 1;
                anonymousUsersBasket.Items.Remove(anonymousItem);
            }
        }
        loggedInUsersBasket.Items.AddRange(anonymousUsersBasket.Items);

        var response = await repository.UpdateBasketAsync(loggedInUsersBasket);
        if (response is null)
        {
            ThrowBasketDoesNotExist(userId);    // if this happens, there is a race condition
        }

        await repository.DeleteBasketAsync(anonymousUserId);

        return MapToCustomerBasketResponse(response);
    }

    /// <remarks>
    /// Anonymous user's basket should be deleted upon user log in.
    /// Logged-in user's basket should be deleted upon checkout.
    /// </remarks>
    public override async Task<DeleteBasketResponse> DeleteBasket(DeleteBasketRequest request, ServerCallContext context)
    {
        var userId = context.GetUserIdentity();
        if (string.IsNullOrEmpty(userId))
        {
            ThrowNotAuthenticated();
        }

        await repository.DeleteBasketAsync(userId);
        return new();
    }

    [DoesNotReturn]
    private static void ThrowNotAuthenticated() => throw new RpcException(new Status(StatusCode.Unauthenticated, "The caller is not authenticated."));

    [DoesNotReturn]
    private static void ThrowBasketDoesNotExist(string userId) => throw new RpcException(new Status(StatusCode.NotFound, $"Basket with buyer id {userId} does not exist"));

    private static CustomerBasketResponse MapToCustomerBasketResponse(CustomerBasket customerBasket)
    {
        var response = new CustomerBasketResponse();

        foreach (var item in customerBasket.Items)
        {
            response.Items.Add(new BasketItem()
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
            });
        }

        return response;
    }

    private static CustomerBasket MapToCustomerBasket(string userId, UpdateBasketRequest customerBasketRequest)
    {
        var response = new CustomerBasket
        {
            BuyerId = userId
        };

        foreach (var item in customerBasketRequest.Items)
        {
            response.Items.Add(new()
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
            });
        }

        return response;
    }
}
