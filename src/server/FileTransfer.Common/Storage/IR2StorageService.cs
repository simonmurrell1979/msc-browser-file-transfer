using System;
using System.Collections.Generic;
using System.Text;

namespace FileTransfer.Common.Storage
{
    
    public interface IR2StorageService
    {

        Task<bool> TestConnectionAsync();

    }

}
