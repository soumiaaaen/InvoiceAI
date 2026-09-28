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

        // "User" (par defaut) ou "Admin". Jamais modifiable via
        // l'inscription - seul un changement direct en base (ou via un
        // admin existant, non implemente) peut promouvoir un compte.
        [Required, MaxLength(20)]
        public string Role { get; set; } = "User";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // --- Verification d'email ---
        // Champs inutilises depuis le retrait de la confirmation d'email
        // obligatoire (voir PASSATION_PROJET.md) - conserves dans le schema
        // sans migration destructrice, EmailConfirmed reste toujours true.
        public bool EmailConfirmed { get; set; } = false;

        [MaxLength(200)]
        public string? EmailConfirmationToken { get; set; }

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