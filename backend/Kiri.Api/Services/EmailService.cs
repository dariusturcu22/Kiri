using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Kiri.Api.Services;

public sealed class EmailService(IConfiguration config, ILogger<EmailService> logger) : IEmailService
{
    public async Task SendAsync(string to, string subject, string htmlBody)
    {
        var smtp     = config["Email:Smtp"];
        var username = config["Email:Username"];
        var password = config["Email:Password"];
        var from     = config["Email:From"] ?? "noreply@kiri.com";
        var port     = int.TryParse(config["Email:Port"], out var p) ? p : 587;

        if (string.IsNullOrWhiteSpace(smtp) || string.IsNullOrWhiteSpace(username))
        {
            // Dev mode: print to console instead of sending real email
            logger.LogInformation(
                "[EMAIL DEV] To: {To} | Subject: {Subject}\n{Body}",
                to, subject, htmlBody);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(from));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };

        using var client = new SmtpClient();
        await client.ConnectAsync(smtp, port, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(username, password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
