namespace FileTransfer.Common.Models.Downloads
{

    public class TransferInfoResponse
    {

        public string Filename { get; set; } = "";
        public long Size { get; set; } = 0;
        public string DownloadUrl { get; set; } = "";

    }

}
