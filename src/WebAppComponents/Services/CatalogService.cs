using System.Net.Http.Json;
using System.Web;
using eShop.WebAppComponents.Catalog;

namespace eShop.WebAppComponents.Services;

public class CatalogService(HttpClient httpClient) : ICatalogService
{
    private readonly string remoteServiceBaseUrl = "api/catalog/";

    public async Task<string?> InitUserId()
    {
        var uri = $"{remoteServiceBaseUrl}ff/initializeId";
        var response = await httpClient.GetAsync(uri);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadAsStringAsync();
    }

    public async Task<string> TrackEventAsync(string eventTypeId, string valueString, long value)
    {
        var response = await httpClient.GetAsync(remoteServiceBaseUrl + "ff/track?eventTypeId=" + eventTypeId + "&valueString=" + valueString + "&value=" + value);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadAsStringAsync();      
    }

    public async Task<string?> MaxTokensAsync()
    {
        var uri = $"{remoteServiceBaseUrl}ff/max_tokens";
        var response = await httpClient.GetAsync(uri);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadAsStringAsync();        
    }

   public async Task<string?> DisplayRatingAsync()
    {
        var uri = $"{remoteServiceBaseUrl}ff/display_rating";
        var response = await httpClient.GetAsync(uri);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadAsStringAsync();
    }
    
   public async Task<string?> DisplayDiscountAsync()
    {
        var uri = $"{remoteServiceBaseUrl}ff/display_discount";
        var response = await httpClient.GetAsync(uri);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadAsStringAsync();
    }

    public async Task<string?> CatalogPageSizeEnabledAsync()
    {
        var uri = $"{remoteServiceBaseUrl}ff/page_size";
        var response = await httpClient.GetAsync(uri);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadAsStringAsync();
    }

    public async Task<CatalogItem?> GetCatalogItem(int id)
    {
        await TrackEventAsync("getCatalogItem_count", "count", 1L);
        var uri = $"{remoteServiceBaseUrl}items/{id}";
        long start = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var result = await httpClient.GetFromJsonAsync<CatalogItem>(uri);
        long end = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await TrackEventAsync("getCatalogItem_latency_in_ms", "latency_in_ms", end - start);
        return result;
    }

    public async Task<CatalogResult> GetCatalogItems(int pageIndex, int pageSize, int? brand, int? type)
    {
        var uri = GetAllCatalogItemsUri(remoteServiceBaseUrl, pageIndex, pageSize, brand, type);
        var result = await httpClient.GetFromJsonAsync<CatalogResult>(uri);
        return result!;
    }

    public async Task<List<CatalogItem>> GetCatalogItems(IEnumerable<int> ids)
    {
        var uri = $"{remoteServiceBaseUrl}items/by?ids={string.Join("&ids=", ids)}";
        var result = await httpClient.GetFromJsonAsync<List<CatalogItem>>(uri);
        return result!;
    }

    public Task<CatalogResult> GetCatalogItemsWithSemanticRelevance(int page, int take, string text)
    {
        var url = $"{remoteServiceBaseUrl}items/withsemanticrelevance/{HttpUtility.UrlEncode(text)}?pageIndex={page}&pageSize={take}";
        var result = httpClient.GetFromJsonAsync<CatalogResult>(url);
        return result!;
    }

    public async Task<IEnumerable<CatalogBrand>> GetBrands()
    {
        var uri = $"{remoteServiceBaseUrl}catalogBrands";
        var result = await httpClient.GetFromJsonAsync<CatalogBrand[]>(uri);
        return result!;
    }

    public async Task<IEnumerable<CatalogItemType>> GetTypes()
    {
        var uri = $"{remoteServiceBaseUrl}catalogTypes";
        var result = await httpClient.GetFromJsonAsync<CatalogItemType[]>(uri);
        return result!;
    }

    private static string GetAllCatalogItemsUri(string baseUri, int pageIndex, int pageSize, int? brand, int? type)
    {
        string filterQs;

        if (type.HasValue)
        {
            var brandQs = brand.HasValue ? brand.Value.ToString() : string.Empty;
            filterQs = $"/type/{type.Value}/brand/{brandQs}";

        }
        else if (brand.HasValue)
        {
            var brandQs = brand.HasValue ? brand.Value.ToString() : string.Empty;
            filterQs = $"/type/all/brand/{brandQs}";
        }
        else
        {
            filterQs = string.Empty;
        }

        return $"{baseUri}items{filterQs}?pageIndex={pageIndex}&pageSize={pageSize}";
    }
}
