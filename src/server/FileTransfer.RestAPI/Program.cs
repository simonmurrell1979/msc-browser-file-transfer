
namespace FileTransfer.RestAPI
{

    public class Program
    {

        public static void Main(string[] args)
        {

            // Create Builder
            var builder = WebApplication.CreateBuilder(args);

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

            // Use HTTPS Redirection and Authorization
            app.UseHttpsRedirection();
            app.UseAuthorization();
            // Map Controllers
            app.MapControllers();

            // Run Application
            app.Run();

        }

    }

}
