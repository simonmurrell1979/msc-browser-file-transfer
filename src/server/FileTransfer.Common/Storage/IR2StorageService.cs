namespace FileTransfer.Common.Storage
{
    
    public interface IR2StorageService
    {

        Task<(bool Connected, string? ErrorMessage)> TestConnectionAsync();
        Task<string> GeneratePutUrlAsync(string ObjectKey);

    }

}
