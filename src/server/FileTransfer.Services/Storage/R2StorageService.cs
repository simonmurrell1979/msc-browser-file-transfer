using FileTransfer.Common.Storage;
using System;
using System.Collections.Generic;
using System.Text;

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
