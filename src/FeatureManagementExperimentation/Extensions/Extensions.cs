namespace FeatureManagementExperimentation.Extensions;

public static class Extensions
{
    public static void AddApplicationServices(this IHostApplicationBuilder builder)
    {
        builder.AddDefaultAuthentication();

        builder.AddRabbitMqEventBus("eventbus");
    }
}