using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace FileTransfer.Common.Json
{

    public class DateTimeConverter : JsonConverter<DateTime>
    {

        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {

            // Assign Value
            var value = reader.GetString();
            // Check Value
            if (string.IsNullOrWhiteSpace(value))
                return default;
            // Return
            return DateTime.Parse(value, 
                CultureInfo.InvariantCulture);

        }
        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options) => writer.WriteStringValue(DateTime.SpecifyKind(value, DateTimeKind.Utc));

    }

}
