using System.ComponentModel.DataAnnotations;

namespace SmartFactureTracker.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required, EmailAddress, MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required, MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<Facture> Factures { get; set; } = new List<Facture>();
    }
}
