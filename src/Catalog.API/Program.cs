using Asp.Versioning.Builder;
using Microsoft.FeatureManagement;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration
    .AddAzureAppConfiguration(options =>
    {
        options.Connect("Endpoint=https://eshopexperimentationres.azconfig.io;Id=q1Zk;Secret=1ltGicJJ6E7XDBIaoC3gOcehRHwNpuLGyYroVKn7NiKmLKoquFEYJQQJ99AHAC1i4TkRJSQEAAACAZAC0eQS");
        // Load all feature flags with no label, refresh every 30 seconds by default
        options.UseFeatureFlags();
    });
    
// builder.Services.AddHttpContextAccessor();

// Add Azure App Configuration and feature management services to the container.
builder.Services.AddAzureAppConfiguration()
    .AddFeatureManagement();

builder.AddServiceDefaults();
builder.AddApplicationServices();
builder.Services.AddProblemDetails();

var withApiVersioning = builder.Services.AddApiVersioning();

builder.AddDefaultOpenApi(withApiVersioning);

var app = builder.Build();

// Use Azure App Configuration middleware for dynamic configuration refresh.
app.UseAzureAppConfiguration();

// Add TargetingId to HttpContext for telemetry ??
// app.UseMiddleware<TargetingHttpContextMiddleware>();

app.MapDefaultEndpoints();

app.NewVersionedApi("Catalog")
   .MapCatalogApiV1();

app.UseDefaultOpenApi();
app.Run();
