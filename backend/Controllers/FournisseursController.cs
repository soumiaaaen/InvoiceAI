using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartFactureTracker.Data;

namespace SmartFactureTracker.Controllers
{
    public class SupplierSummaryDto
    {
        public string Merchant { get; set; } = string.Empty;
        public int InvoiceCount { get; set; }
        public decimal TotalTtc { get; set; }
        public DateTime LastInvoiceDate { get; set; }
        public string TopCategory { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/fournisseurs")]
    [Authorize]
    public class FournisseursController : ControllerBase
    {
        private readonly AppDbContext _db;

        public FournisseursController(AppDbContext db)
        {
            _db = db;
        }

        // GET api/fournisseurs/summary
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(CancellationToken ct)
        {
            int currentUserId = GetCurrentUserId();

            // Include(Category) necessaire ici aussi : liste materialisee
            // en memoire avant le regroupement par categorie dominante.
            var factures = await _db.Factures
                .Include(f => f.Category)
                .Where(f => f.UserId == currentUserId)
                .ToListAsync(ct);

            var summary = factures
                .GroupBy(f => f.Merchant)
                .Select(g => new SupplierSummaryDto
                {
                    Merchant = g.Key,
                    InvoiceCount = g.Count(),
                    TotalTtc = g.Sum(f => f.MontantTtc),
                    LastInvoiceDate = g.Max(f => f.InvoiceDate),
                    TopCategory = g
                        .GroupBy(f => f.Category?.Name ?? "Non classee")
                        .OrderByDescending(cg => cg.Count())
                        .First()
                        .Key
                })
                .OrderByDescending(s => s.TotalTtc)
                .ToList();

            return Ok(summary);
        }

        // GET api/fournisseurs/export?month=2026-08
        [HttpGet("export")]
        public async Task<IActionResult> Export([FromQuery] string month, CancellationToken ct)
        {
            if (!DateTime.TryParseExact(
                    month + "-01",
                    "yyyy-MM-dd",
                    System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.None,
                    out var monthStart))
            {
                return BadRequest(new { error = "Le parametre 'month' doit etre au format yyyy-MM, ex: 2026-08." });
            }

            var monthEnd = monthStart.AddMonths(1);
            int currentUserId = GetCurrentUserId();

            var factures = await _db.Factures
                .Include(f => f.Category)
                .Where(f => f.UserId == currentUserId
                    && f.InvoiceDate >= monthStart
                    && f.InvoiceDate < monthEnd)
                .ToListAsync(ct);

            var rows = factures
                .GroupBy(f => f.Merchant)
                .Select(g => new
                {
                    Merchant = g.Key,
                    TotalTtc = g.Sum(f => f.MontantTtc),
                    TopCategory = g
                        .GroupBy(f => f.Category?.Name ?? "Non classee")
                        .OrderByDescending(cg => cg.Count())
                        .First()
                        .Key
                })
                .OrderByDescending(r => r.TotalTtc)
                .ToList();

            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Depenses par fournisseur");

            ws.Cell(1, 1).Value = "Fournisseur";
            ws.Cell(1, 2).Value = "Categorie";
            ws.Cell(1, 3).Value = "Montant paye (MAD)";
            var headerRange = ws.Range(1, 1, 1, 3);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.FromArgb(0xDC, 0xE4, 0xFF);
            headerRange.Style.Font.FontColor = XLColor.FromArgb(0x13, 0x22, 0x4A);

            int currentRow = 2;
            foreach (var r in rows)
            {
                ws.Cell(currentRow, 1).Value = r.Merchant;
                ws.Cell(currentRow, 2).Value = r.TopCategory;
                ws.Cell(currentRow, 3).Value = r.TotalTtc;
                ws.Cell(currentRow, 3).Style.NumberFormat.Format = "#,##0.00";
                currentRow++;
            }

            currentRow++; // ligne vide avant le total
            var total = rows.Sum(r => r.TotalTtc);
            ws.Cell(currentRow, 1).Value = "Total du mois";
            ws.Cell(currentRow, 1).Style.Font.Bold = true;
            ws.Cell(currentRow, 3).Value = total;
            ws.Cell(currentRow, 3).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(currentRow, 3).Style.Font.Bold = true;
            var totalRange = ws.Range(currentRow, 1, currentRow, 3);
            totalRange.Style.Border.TopBorder = XLBorderStyleValues.Medium;

            ws.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            stream.Position = 0;

            var fileName = $"depenses_{month}.xlsx";
            return File(
                stream.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName);
        }

        private int GetCurrentUserId()
        {
            var sub = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (sub == null || !int.TryParse(sub, out var userId))
                throw new UnauthorizedAccessException("Utilisateur non authentifie.");

            return userId;
        }
    }
}