using Microsoft.EntityFrameworkCore;
using SmartFactureTracker.Models;

namespace SmartFactureTracker.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Facture> Factures => Set<Facture>();
        public DbSet<Category> Categories => Set<Category>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

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

            // Relation User -> Categories (1-N) - chaque categorie appartient
            // a un seul utilisateur, supprimee si le compte est supprime
            modelBuilder.Entity<Category>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Pas deux categories avec le meme nom pour un meme utilisateur
            modelBuilder.Entity<Category>()
                .HasIndex(c => new { c.UserId, c.Name })
                .IsUnique();

            // Relation Facture -> Category (N-1), optionnelle. Si la
            // categorie est supprimee, la facture repasse "non classee"
            // (CategoryId = null) plutot que d'etre supprimee ou bloquee.
            modelBuilder.Entity<Facture>()
                .HasOne(f => f.Category)
                .WithMany()
                .HasForeignKey(f => f.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            // Index utile pour les recherches par date / fournisseur
            modelBuilder.Entity<Facture>()
                .HasIndex(f => f.InvoiceDate);

            modelBuilder.Entity<Facture>()
                .HasIndex(f => f.Merchant);

            modelBuilder.Entity<Facture>()
                .HasIndex(f => f.CategoryId);
        }
    }
}