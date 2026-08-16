using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartFactureTracker.Migrations
{
    /// <inheritdoc />
    public partial class AddNumeroFacture : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsConfirmed",
                table: "Factures");

            migrationBuilder.DropColumn(
                name: "NeedsManualReview",
                table: "Factures");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Factures");

            migrationBuilder.AddColumn<string>(
                name: "NumeroFacture",
                table: "Factures",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NumeroFacture",
                table: "Factures");

            migrationBuilder.AddColumn<bool>(
                name: "IsConfirmed",
                table: "Factures",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "NeedsManualReview",
                table: "Factures",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Factures",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);
        }
    }
}
