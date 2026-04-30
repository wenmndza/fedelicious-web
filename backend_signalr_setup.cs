// NotificationHub.cs
using Microsoft.AspNetCore.SignalR;

public class NotificationHub : Hub
{
    // Empty hub class for broadcasting notifications
}

// In your OrderController.cs
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

public class OrderController : ControllerBase
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly YourDbContext _context; // Your database context

    public OrderController(IHubContext<NotificationHub> hubContext, YourDbContext context)
    {
        _hubContext = hubContext;
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] Order order)
    {
        // Your existing order creation logic
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        // Send real-time notification to all connected admin clients
        await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
        {
            type = "order",
            message = $"New order #{order.order_id} placed by customer."
        });

        return Ok(new { order_id = order.order_id });
    }
}

// In Startup.cs or Program.cs (for .NET 6+)
public void ConfigureServices(IServiceCollection services)
{
    // ... your existing services
    services.AddSignalR();
}

public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    // ... your existing middleware

    app.UseEndpoints(endpoints =>
    {
        endpoints.MapControllers();
        endpoints.MapHub<NotificationHub>("/notificationHub"); // This matches your frontend URL
    });
}