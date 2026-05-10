namespace FileTransfer.Common.Configuration
{
    
    public class R2Options
    {

        public const string SectionName = "R2";
        public string AccountId { get; set; } = "";
        public string AccessKeyId { get; set; } = "";
        public string SecretAccessKey { get; set; } = "";
        public string BucketName { get; set; } = "";

    }

}
