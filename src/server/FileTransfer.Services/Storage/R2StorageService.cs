using FileTransfer.Common.Storage;

namespace FileTransfer.Services.Storage
{
    
    public class R2StorageService: IR2StorageService
    {

        public Task<bool> TestConnectionAsync()
        {
            
            return Task.FromResult(true);

        }

    }

}
