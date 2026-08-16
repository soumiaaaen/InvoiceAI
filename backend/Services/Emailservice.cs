using System.Net;
using System.Net.Mail;

namespace SmartFactureTracker.Services
{
    public interface IEmailService
    {
        Task SendConfirmationEmailAsync(string toEmail, string fullName, string confirmationLink);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendConfirmationEmailAsync(string toEmail, string fullName, string confirmationLink)
        {
            var smtpHost = _config["Smtp:Host"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_config["Smtp:Port"] ?? "587");
            var smtpUser = _config["Smtp:Username"]
                ?? throw new InvalidOperationException("Smtp:Username manquant dans appsettings.json");
            var smtpPassword = _config["Smtp:AppPassword"]
                ?? throw new InvalidOperationException("Smtp:AppPassword manquant dans appsettings.json");

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(smtpUser, smtpPassword)
            };

            var message = new MailMessage
            {
                From = new MailAddress(smtpUser, "Smart Facture Tracker"),
                Subject = "Confirmez votre adresse email",
                IsBodyHtml = true,
                Body = $"""
                    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
                        <h2>Bienvenue sur Smart Facture Tracker, {fullName} !</h2>
                        <p>Merci de vous etre inscrit. Veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous :</p>
                        <p style="margin: 24px 0;">
                            <a href="{confirmationLink}" 
                               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 8px; display: inline-block;">
                                Confirmer mon email
                            </a>
                        </p>
                        <p style="color: #666; font-size: 13px;">
                            Ce lien expire dans 24 heures. Si vous n'etes pas a l'origine de cette inscription, 
                            vous pouvez ignorer cet email.
                        </p>
                    </div>
                    """
            };
            message.To.Add(toEmail);

            await client.SendMailAsync(message);
        }
    }
}