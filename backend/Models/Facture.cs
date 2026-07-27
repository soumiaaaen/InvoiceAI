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

        [Required]
        public FactureCategory Category { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        // Chemin/nom du fichier facture stocke localement sur le serveur
        [MaxLength(500)]
        public string? ReceiptFilePath { get; set; }

        // Vrai si l'extraction automatique a echoue ou semble incoherente
        // (ex: MontantHt == MontantTtc, indiquant une TVA non detectee)
        // -> force une revue manuelle avant validation definitive
        public bool NeedsManualReview { get; set; } = false;

        // Vrai une fois que l'utilisateur a confirme/valide les donnees
        // extraites - avant Confirmed, la facture est consideree "brouillon"
        public bool IsConfirmed { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Relation avec l'utilisateur qui a ajoute la facture
        public int UserId { get; set; }
        public User? User { get; set; }
    }
}
