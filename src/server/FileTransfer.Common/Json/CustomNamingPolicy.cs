using System.Text.Json;

namespace FileTransfer.Common.Json
{

    public class CustomNamingPolicy : JsonNamingPolicy
    {

        public override string ConvertName(string name) => name;

    }

}
