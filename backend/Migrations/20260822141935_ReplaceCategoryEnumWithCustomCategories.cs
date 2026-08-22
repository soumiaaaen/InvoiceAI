using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartFactureTracker.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceCategoryEnumWithCustomCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Factures_Category",
                table: "Factures");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Factures");

            migrationBuilder.AddColumn<int>(
                name: "CategoryId",
                table: "Factures",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Categories_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Factures_CategoryId",
                table: "Factures",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_UserId_Name",
                table: "Categories",
                columns: new[] { "UserId", "Name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Factures_Categories_CategoryId",
                table: "Factures",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Factures_Categories_CategoryId",
                table: "Factures");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropIndex(
                name: "IX_Factures_CategoryId",
                table: "Factures");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "Factures");

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Factures",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Factures_Category",
                table: "Factures",
                column: "Category");
        }
    }
}
