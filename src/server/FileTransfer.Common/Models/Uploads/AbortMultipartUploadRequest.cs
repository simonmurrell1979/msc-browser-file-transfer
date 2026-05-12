namespace FileTransfer.Common.Models.Uploads
{
    
    public class AbortMultipartUploadRequest
    {

        public string ObjectKey { get; set; } = "";
        public string UploadId { get; set; } = "";

    }

}
