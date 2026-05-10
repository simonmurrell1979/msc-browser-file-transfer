using FileTransfer.Common.Configuration;
using FileTransfer.Common.Storage;
using Microsoft.Extensions.Options;

namespace FileTransfer.Services.Storage
{
    
    public class R2StorageService: IR2StorageService
    {

        #region Variables

        // Private Variables
        private readonly R2Options _r2Options;

        #endregion

        #region Constructor

        public R2StorageService(IOptions<R2Options> r2Options)
        {

            // Initialize Variables
            _r2Options = r2Options.Value;

        }

        #endregion

        #region TestConnectionAsync

        public Task<bool> TestConnectionAsync()
        {
            
            return Task.FromResult(true);

        }

        #endregion

    }

}
