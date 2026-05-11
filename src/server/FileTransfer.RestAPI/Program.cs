
using FileTransfer.Common.Configuration;
using FileTransfer.Common.Helpers;
using FileTransfer.Common.Storage;
using FileTransfer.Services.Storage;
using System.Text.Json.Serialization;

namespace FileTransfer.RestAPI
{

    public class Program
    {

        #region Main

        public static void Main(string[] args)
        {

            // Create Builder
            var builder = WebApplication.CreateBuilder(args);

            // Add Configuration
            builder.Services.Configure<R2Options>(builder.Configuration.GetSection(R2Options.SectionName));
            // Add Services
            builder.Services.AddSingleton<IR2StorageService, R2StorageService>();

            // Add CORS Policy
            builder.Services.AddCors(options =>
            {

                // Add Development Policy
                options.AddPolicy("AllowLocalhost", policy =>
                {

                    // Allow request from localhost -> Remember to add security later for production!!!
                    policy.WithOrigins("http://localhost:3000", "http://localhost:4200")
                        .AllowAnyHeader()
                        .AllowAnyMethod();

                });

            });
            // Add Controllers and OpenAPI
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {

                    // Use PascalCase for JSON properties (matches C# conventions)
                    options.JsonSerializerOptions.PropertyNamingPolicy = null;
                    options.JsonSerializerOptions.WriteIndented = false;
                    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;

                    // Apply custom JSON defaults
                    JsonHelper.ApplyDefaults(options.JsonSerializerOptions);

                });
            builder.Services.AddOpenApi();
            // Add Services
            var app = builder.Build();

            // Check if in development environment and map OpenAPI
            if (app.Environment.IsDevelopment())
            {

                // Map OpenAPI
                app.MapOpenApi();
                // Use CORS Policy
                app.UseCors("AllowLocalhost");

            }
            else
            {

                // Use CORS Policy - Remember to add for production environment

            }

            // Use Bath Path /api/
            app.UsePathBase("/api/");
            // Use HTTPS Redirection and Authorization
            app.UseHttpsRedirection();
            app.UseAuthorization();
            // Map Controllers
            app.MapControllers();

            // Run Application
            app.Run();

        }

        #endregion

    }

}
