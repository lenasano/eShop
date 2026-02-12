using FeatureManagementExperimentation.Grpc;
using Grpc.Core;
using GrpcFmeClient = FeatureManagementExperimentation.Grpc.Fme.FmeClient;

namespace eShop.WebApp.Services;

   /// <summary>
   /// A list of FME feature flag names (strings).
   /// </summary>
   /// <remarks>
   /// These string values must match feature flag *Name* values in Harness FME.
   /// </remarks>
   public readonly struct FlagNames {
    public const string DisplayProductRating = "display_product_rating";
    public const string DisplayDiscount      = "display_discount";
};

public class FmeService(GrpcFmeClient fmeClient, ILogger<FmeService> logger)
{
    public async Task<string> GetFlagTreatmentAsync(string flagName) => await GetFlagTreatmentAsync(flagName, null);

    public async Task<string> GetFlagTreatmentAsync(string flagName, Dictionary<string,object>? attributes)
    {
        try
        {
            FlagRequest flagRequest = new FlagRequest{FlagName = flagName};
            if( attributes is not null)
                foreach(var a in attributes) flagRequest.Attributes.TryAdd(a.Key, a.Value.ToString());

            FlagReply flagReply = await fmeClient.GetFlagTreatmentAsync(flagRequest);
            return flagReply.TreatmentResult;
        }
        catch (RpcException e)
        {
            logger.LogError($"FME service error, failed to get feature flag treatment: \n Exception {e.StatusCode}: {e.Status.Detail}");
        }
        catch (Exception e)
        {
            logger.LogError($"FME service error, failed to get feature flag treatment: \n Exception: {e.Message}");
        }
        return "control";
    }
}