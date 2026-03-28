using FeatureManagementExperimentation.Extensions;
using Microsoft.AspNetCore.Authorization;
using Splitio.Domain;
using Splitio.Services.Client.Classes;
using Splitio.Services.Client.Interfaces;
using Splitio.Services.Logger;

namespace FeatureManagementExperimentation.Grpc;

public class FmeService : Fme.FmeBase
{
    private static readonly string FME_SERVERSIDE_SDK_KEY = "FME_SERVERSIDE_SDK_KEY";
    private static readonly string TRAFFIC_TYPE = "user";

    private readonly ILogger<FmeService> _logger;
    private readonly ISplitClient? _fmeSdkClient;

    public FmeService(ILogger<FmeService> logger)
    {
        _logger = logger;
        _logger.LogDebug($"Initializing FmeService. This service should be added as a singleton, so this message should be logged just once (each time the application starts).");

        try
        {
            // set up FME API connection
            _fmeSdkClient = 
                new SplitFactory( 
                    Environment.GetEnvironmentVariable(FME_SERVERSIDE_SDK_KEY),
                    new ConfigurationOptions{ Logger = new FmeLogger(logger) } )
                .Client();
            _fmeSdkClient?.BlockUntilReady(10 * 1000);  // wait 10 seconds for FME feature flag targeting rules and segments to be fetched
        }
        catch (Exception e)
        {
            _logger.LogError($"Failed to connect to FME, feature flags will NOT be evaluated.\n Exception: {e.Message}");
        }
    }

    [AllowAnonymous]
    public override async Task<FlagReply> GetFlagTreatment(FlagRequest request, ServerCallContext context)
    {
        _logger.LogDebug($"FME - getting treatment for flag \"{request.FlagName}\"");

        Key matchingKeys = context.GetUserIdentityAndBucketingKey();

        try
        {
            if( _fmeSdkClient is not null)
            {
                Dictionary<string,object>? attributes = 
                    ( request.Attributes != null && request.Attributes.Count > 0 )
                    ? request.Attributes.ToDictionary( pair => pair.Key, pair => (object) pair.Value )
                    : null;
                
                return new FlagReply
                    { 
                        TreatmentResult = await _fmeSdkClient.GetTreatmentAsync(
                                                    matchingKeys,
                                                    request.FlagName,
                                                    attributes
                                          )
                    };
            }
        }
        catch (Exception e) { _logger?.LogError(e.Message); }

        return new FlagReply{ TreatmentResult = "control" };
    }

    [AllowAnonymous]
    public override async Task<TrackReply> TrackEvent(EventInfo eventInfo, ServerCallContext context)
    {
        _logger.LogDebug($"FME - sending event: {eventInfo.EventType}:{eventInfo.Value}");

        string? userId = context.GetUserIdentity();

        try
        {
            if( _fmeSdkClient is not null)
                return new TrackReply
                    { 
                        IsEventTrackedSuccessfully = await _fmeSdkClient.TrackAsync(
                                                                userId,
                                                                TRAFFIC_TYPE,
                                                                eventInfo.EventType,
                                                                eventInfo.Value
                                                    )
                    };
        }
        catch (Exception e) { _logger?.LogError(e.Message); }

        return new TrackReply{ IsEventTrackedSuccessfully = false };
    }


    private class FmeLogger : ISplitLogger
    {
        public bool IsDebugEnabled {get; set;} = true;
        private ILogger<FmeService> _logger;

        public FmeLogger(ILogger<FmeService> logger) => _logger = logger;

        public void Error(string message, Exception e) => _logger.LogError      (e, "   FME - " + message);
        public void Error(string message             ) => _logger.LogError      (   "   FME - " + message);
        public void Debug(string message, Exception e) => _logger.LogDebug      (e, "   FME - " + message);
        public void Debug(string message             ) => _logger.LogDebug      (   "   FME - " + message);
        public void Warn (string message, Exception e) => _logger.LogWarning    (e, "   FME - " + message);
        public void Warn (string message             ) => _logger.LogWarning    (   "   FME - " + message);
        public void Info (string message, Exception e) => _logger.LogInformation(e, "   FME - " + message);
        public void Info (string message             ) => _logger.LogInformation(   "   FME - " + message);
        public void Trace(string message, Exception e) => _logger.LogTrace      (e, "   FME - " + message);
        public void Trace(string message             ) => _logger.LogTrace      (   "   FME - " + message);
    }
}
