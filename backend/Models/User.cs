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

        // --- Verification d'email ---
        public bool EmailConfirmed { get; set; } = false;

        // Token unique envoye par email, verifie a la confirmation
        [MaxLength(200)]
        public string? EmailConfirmationToken { get; set; }

        // Le token expire pour eviter qu'un lien reste valide indefiniment
        public DateTime? EmailConfirmationTokenExpiresAt { get; set; }

        // --- Preferences ---
        // Utilise pour prerempir le taux de TVA lors de l'upload d'une
        // facture, si l'IA ne parvient pas a le detecter automatiquement.
        [Range(0, 100)]
        public decimal DefaultTvaRate { get; set; } = 20.0m;

        // Navigation
        public ICollection<Facture> Factures { get; set; } = new List<Facture>();
    }
}