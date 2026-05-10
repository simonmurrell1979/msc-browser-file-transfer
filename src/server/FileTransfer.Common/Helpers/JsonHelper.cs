using FileTransfer.Common.Json;
using System.Globalization;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using System.Text.Json.Serialization.Metadata;

namespace FileTransfer.Common.Helpers
{

    public static class JsonHelper
    {

        #region Variables

        // Private Variables
        private static readonly JsonSerializerOptions _defaultOptions = CreateDefaultOptions();
        // Public Variables
        public static JsonSerializerOptions DefaultOptions => _defaultOptions;

        #endregion

        #region CreateDefaultOptions

        private static JsonSerializerOptions CreateDefaultOptions()
        {

            // Initialize Class
            var resolver = new DefaultJsonTypeInfoResolver
            {
                Modifiers =
                {
                    ti =>
                    {

                        // Check Value
                        if (ti.Kind == JsonTypeInfoKind.Object)
                        {
                            
                            // Sort Properties by name
                            var sorted = ti.Properties
                                .OrderBy(p => p.Name.Equals("Success", StringComparison.OrdinalIgnoreCase) ? 0 : 1) // Success first
                                .ThenBy(p => p.Name, StringComparer.Ordinal) // then alphabetically
                                .ToList();
                            // Clear Properties
                            ti.Properties.Clear();
                            // Search through Properties
                            foreach (var prop in sorted)
                            {

                                // Add Property
                                ti.Properties.Add(prop);

                            }

                        }
                    }
                }
            };
            // Initialize Class
            var options = new JsonSerializerOptions
            {
                Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
                PropertyNamingPolicy = new CustomNamingPolicy(),
                WriteIndented = false,
                TypeInfoResolver = resolver,
                PropertyNameCaseInsensitive = true,
                NumberHandling = JsonNumberHandling.AllowReadingFromString
            };
            // Add Converters
            options.Converters.Add(new DateTimeConverter());
            options.Converters.Add(new JsonStringConverter());
            // Return
            return options;

        }

        #endregion

        #region CloneOptions

        private static JsonSerializerOptions CloneOptions(bool indented)
        {

            // Initialize Class
            var retVal = new JsonSerializerOptions(_defaultOptions)
            {
                WriteIndented = indented
            };
            // Return
            return retVal;

        }

        #endregion

        #region ApplyDefaults

        public static void ApplyDefaults(JsonSerializerOptions target)
        {

            // Initialize Class
            var defaults = DefaultOptions;
            // Assign Values
            target.Encoder = defaults.Encoder;
            target.PropertyNamingPolicy = defaults.PropertyNamingPolicy;
            target.WriteIndented = defaults.WriteIndented;
            target.TypeInfoResolver = defaults.TypeInfoResolver;
            // Search through Converters
            foreach (var converter in defaults.Converters)
            {

                // Add Converter
                target.Converters.Add(converter);

            }

        }

        #endregion

        #region GetJsonObject

        public static JsonObject GetJsonObject(string Json)
        {

            // Assign Value
            Json = string.IsNullOrWhiteSpace(Json) ? "{}" : Json;
            try
            {

                // Initialize Class
                var node = JsonNode.Parse(Json) as JsonObject;
                // Force initialization to catch duplicates
                _ = node?.Count;
                // Return
                return node ?? new JsonObject();

            }
            catch (ArgumentException)
            {

                // Fallback - deduplicate
                using var document = JsonDocument.Parse(Json);
                // Build clean JsonObject
                var jsonObject = new JsonObject();
                // Loop Properties
                foreach (var property in document.RootElement.EnumerateObject())
                {

                    // Assign Value (overwrites duplicates)
                    jsonObject[property.Name] = JsonNode.Parse(property.Value.GetRawText());

                }
                // Return
                return jsonObject;

            }

        }

        #endregion

        #region ToJsonString

        public static string ToJsonString(JsonObject Obj, bool Indented = false)
        {

            // Return
            return Obj.ToJsonString(CloneOptions(Indented));

        }

        #endregion

        #region ToJsonString

        public static string ToJsonString(JsonArray Obj, bool Indented = false)
        {

            // Return
            return Obj.ToJsonString(CloneOptions(Indented));

        }

        #endregion

        #region GetString

        public static string GetString(JsonObject Obj, string PropertyName)
        {

            // Return
            return Obj[PropertyName]?.GetValue<string>();

        }

        #endregion

        #region GetBool

        public static bool GetBool(JsonObject Obj, string PropertyName)
        {

            // Check Value
            if (Obj[PropertyName] is JsonValue value && value.TryGetValue(out bool result))
                // Return
                return result;
            // Return
            return false;

        }

        #endregion

        #region GetInt

        public static int? GetInt(JsonObject Obj, string PropertyName)
        {

            // Check Value
            if (Obj[PropertyName] is JsonValue value && value.TryGetValue(out int result))
                // Return
                return result;
            // Check Value
            if (Obj[PropertyName] is JsonValue vs && vs.TryGetValue(out string s) && int.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedResult))
                // Return
                return parsedResult;

            // Return
            return null;



        }

        #endregion

        #region GetLong

        public static long? GetLong(JsonObject Obj, string PropertyName)
        {

            // Check Value
            if (Obj[PropertyName] is JsonValue value && value.TryGetValue(out long result))
                // Return
                return result;
            // Check Value
            if (Obj[PropertyName] is JsonValue vs && vs.TryGetValue(out string s) && long.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedResult))
                // Return
                return parsedResult;
            // Return
            return null;

        }

        #endregion

        #region NullifyProperties

        public static void NullifyProperties(JsonObject Obj, string[] KeysToNull, bool PartialMatch = false)
        {

            // Check Value
            if (Obj == null || KeysToNull == null || KeysToNull.Length == 0)
                return;
            // Initialize Class
            var keysToMatch = KeysToNull
                .Where(k => !string.IsNullOrWhiteSpace(k))
                .Select(k => k.ToLowerInvariant())
                .ToList();

            // Search through Keys
            foreach (var entry in Obj.ToList())
            {

                // Assign Values
                string key = entry.Key;
                string loweredKey = key.ToLowerInvariant();
                // Check Value
                bool match = PartialMatch
                    ? keysToMatch.Any(part => loweredKey.Contains(part))
                    : keysToMatch.Contains(loweredKey);
                // Check Value
                if (match)
                {

                    // Clear Value
                    Obj[key] = null;

                }

            }

        }


        #endregion

        #region Serialize

        public static string Serialize(object Object, bool Indented = false)
        {

            // Initialize Class
            var options = CloneOptions(Indented);
            // Initialize Class
            return JsonSerializer.Serialize(Object,
                options);

        }

        #endregion

        #region Deserialize

        public static T Deserialize<T>(string Json)
        {

            // Check Value
            if (string.IsNullOrWhiteSpace(Json))
                // Return
                return default!;

            // Return
            return JsonSerializer.Deserialize<T>(Json, _defaultOptions)!;

        }

        #endregion

        #region Deserialize

        public static T Deserialize<T>(byte[] Json)
        {

            // Check Value
            if (Json == null || Json.Length == 0)
                // Return
                return default!;

            // Return
            return JsonSerializer.Deserialize<T>(Json, _defaultOptions)!;

        }

        #endregion

        #region Deserialize

        public static object Deserialize(string json, Type returnType = null)
        {

            // Check Value
            if (string.IsNullOrWhiteSpace(json))
                // Return
                return null;
            // Assign Value
            returnType ??= typeof(object);
            // Return
            return JsonSerializer.Deserialize(json, returnType, _defaultOptions);

        }

        #endregion

        #region SetIfMissing

        public static void SetIfMissing(JsonObject Obj, string Key, object Value)
        {

            // Check Value
            if (!Obj.ContainsKey(Key) ||
                Obj[Key] == null)
            {

                // Set Value
                Obj[Key] = JsonValue.Create(Value);

            }

        }

        #endregion

        #region ValidJsonString

        public static bool ValidJsonString(string json)
        {

            // Check Value
            if (string.IsNullOrWhiteSpace(json)) return false;
            // Check Value
            if (!json.Contains("{") && !json.Contains("}")) return false;

            try
            {

                // Parse
                JsonNode.Parse(json);
                // Return
                return true;

            }
            catch (JsonException)
            {

                // Return
                return false;

            }

        }

        #endregion

    }

}
