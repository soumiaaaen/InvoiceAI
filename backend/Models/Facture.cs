using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartFactureTracker.Models
{
    public class Facture
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Merchant { get; set; } = string.Empty;

        [Required]
        public DateTime InvoiceDate { get; set; }

        [Column(TypeName = "decimal(12,2)")]
        public decimal MontantHt { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal TvaRate { get; set; } = 20.0m;

        [Column(TypeName = "decimal(12,2)")]
        public decimal MontantTva { get; set; }

        [Column(TypeName = "decimal(12,2)")]
        public decimal MontantTtc { get; set; }

        [MaxLength(100)]
        public string? NumeroFacture { get; set; }

        // Categorie personnalisee de l'utilisateur - nullable : une facture
        // reste "non classee" si aucune correspondance n'a ete trouvee a
        // l'extraction, ou si la categorie a ete supprimee depuis.
        public int? CategoryId { get; set; }
        public Category? Category { get; set; }

        // Chemin relatif (pas absolu) vers le fichier facture stocke
        // localement sur le serveur, ex: "uploads/factures/xxx.pdf"
        [MaxLength(500)]
        public string? ReceiptFilePath { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Rempli uniquement lors d'une modification ulterieure -
        // reste null a la creation, c'est normal
        public DateTime? UpdatedAt { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }
    }
}