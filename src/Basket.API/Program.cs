var builder = WebApplication.CreateBuilder(args);

builder.AddBasicServiceDefaults();
builder.AddApplicationServices();

//builder.Services.AddGrpc();
builder.Services.AddGrpc(options => { options.Interceptors.Add<ServerHeaderInterceptor>(); });

var app = builder.Build();

app.MapDefaultEndpoints();

app.MapGrpcService<BasketService>();

app.Run();
