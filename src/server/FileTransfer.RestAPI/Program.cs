
using FileTransfer.Common.Configuration;
using FileTransfer.Common.Storage;
using FileTransfer.Services.Storage;

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

            // Add Controllers and OpenAPI
            builder.Services.AddControllers();
            builder.Services.AddOpenApi();
            // Add Services
            var app = builder.Build();

            // Check if in development environment and map OpenAPI
            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
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
