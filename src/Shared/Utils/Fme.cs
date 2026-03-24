namespace FeatureManagementExperimentation.Shared.Utils;

public static class Fme
{
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

    public static bool IsFlagOn(string? flagResult) => ! string.IsNullOrEmpty(flagResult) && 
                                                       ! flagResult.Equals("control") && 
                                                       ! flagResult.Equals("off");

    /// <summary>
    /// A list of FME event types.
    /// </summary>
    /// <remarks>
    /// These string values must match the event types entered in the Metric definitions in Harness FME.
    /// </remarks>
    public readonly struct EventTypes {
        public const string PurchaseAmount = "purchase";
    };
}