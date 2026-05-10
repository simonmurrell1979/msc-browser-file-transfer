using FileTransfer.Common.Factories;
using FileTransfer.Common.Storage;
using Microsoft.AspNetCore.Mvc;

namespace FileTransfer.RestAPI.Controllers
{

    [ApiController]
    [Route("[controller]/[action]")]
    public class StorageController : Controller
    {

        #region Variables

        // Private Variables
        private readonly ILogger<StorageController> _logger;
        private readonly IR2StorageService _storageService;

        #endregion

        #region Constructor

        public StorageController(ILogger<StorageController> logger, 
            IR2StorageService storageService)
        {

            // Initialize Classes
            _logger = logger;
            _storageService = storageService;

        }

        #endregion

        #region TestConnection

        [HttpGet]
        public async Task<object> TestConnection()
        {

            // Test Connection
            var (connected, errorMessage) = await _storageService.TestConnectionAsync();
            
            // Check Value
            if (!connected)
            {

                // Log Warning
                _logger.LogWarning("Storage connection test failed: {ErrorMessage}", errorMessage);
                // Return
                return Ok(JsonResponseFactory.ErrorResponse(errorMessage ?? "Unknown error"));

            }

            // Return
            return Ok(JsonResponseFactory.SuccessResponse());

        }

        #endregion

    }

}
