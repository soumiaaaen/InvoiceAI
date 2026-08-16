using Microsoft.EntityFrameworkCore;
using SmartFactureTracker.Models;

namespace SmartFactureTracker.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Facture> Factures => Set<Facture>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Stocke l'enum Category comme texte lisible en base
            // (plus facile a lire/debugger directement dans SQL Server
            // qu'un simple entier)
            modelBuilder.Entity<Facture>()
                .Property(f => f.Category)
                .HasConversion<string>()
                .HasMaxLength(50);

            // Email unique
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .Property(u => u.DefaultTvaRate)
                .HasColumnType("decimal(5,2)");

            // Relation User -> Factures (1-N)
            modelBuilder.Entity<Facture>()
                .HasOne(f => f.User)
                .WithMany(u => u.Factures)
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Index utile pour les recherches par date / categorie
            // (correspond aux fonctionnalites de recherche prevues)
            modelBuilder.Entity<Facture>()
                .HasIndex(f => f.InvoiceDate);

            modelBuilder.Entity<Facture>()
                .HasIndex(f => f.Category);

            modelBuilder.Entity<Facture>()
                .HasIndex(f => f.Merchant);
        }
    }
}