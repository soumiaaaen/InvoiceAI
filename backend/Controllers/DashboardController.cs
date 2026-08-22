using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartFactureTracker.Data;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace SmartFactureTracker.Controllers
{
    public class CategoryBreakdownDto
    {
        public string Category { get; set; } = string.Empty;
        public decimal Total { get; set; }
    }

    public class MonthlyTotalDto
    {
        public string Month { get; set; } = string.Empty;
        public decimal Total { get; set; }
    }

    public class RecentFactureDto
    {
        public int Id { get; set; }
        public string Merchant { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        public decimal MontantTtc { get; set; }
        public string Category { get; set; } = string.Empty;
    }

    public class DashboardSummaryDto
    {
        public decimal TotalMonth { get; set; }
        public int TotalFactures { get; set; }
        public decimal AverageAmount { get; set; }
        public string TopCategory { get; set; } = string.Empty;
        public decimal TopCategoryAmount { get; set; }
        public List<CategoryBreakdownDto> CategoryBreakdown { get; set; } = new();
        public List<MonthlyTotalDto> MonthlyEvolution { get; set; } = new();
        public List<RecentFactureDto> RecentFactures { get; set; } = new();
    }

    [ApiController]
    [Route("api/dashboard")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _db;

        public DashboardController(AppDbContext db)
        {
            _db = db;
        }

        // GET api/dashboard/summary?month=yyyy-MM
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary([FromQuery] string? month, CancellationToken ct)
        {
            int currentUserId = GetCurrentUserId();

            // Include(Category) necessaire : la liste est materialisee en
            // memoire ci-dessous, sans ca la navigation resterait null.
            var factures = await _db.Factures
                .Include(f => f.Category)
                .Where(f => f.UserId == currentUserId)
                .ToListAsync(ct);

            var now = DateTime.UtcNow;
            int selectedYear = now.Year;
            int selectedMonth = now.Month;

            if (!string.IsNullOrWhiteSpace(month) &&
                DateTime.TryParseExact($"{month}-01", "yyyy-MM-dd", null,
                    System.Globalization.DateTimeStyles.None, out var parsedMonth))
            {
                selectedYear = parsedMonth.Year;
                selectedMonth = parsedMonth.Month;
            }

            var facturesForSelectedMonth = factures
                .Where(f => f.InvoiceDate.Year == selectedYear && f.InvoiceDate.Month == selectedMonth)
                .ToList();

            var totalMonth = facturesForSelectedMonth.Sum(f => f.MontantTtc);

            var averageAmount = factures.Count > 0 ? factures.Average(f => f.MontantTtc) : 0;

            var categoryBreakdown = factures
                .GroupBy(f => f.Category?.Name ?? "Non classee")
                .Select(g => new CategoryBreakdownDto { Category = g.Key, Total = g.Sum(f => f.MontantTtc) })
                .OrderByDescending(c => c.Total)
                .ToList();

            var topCategory = categoryBreakdown.FirstOrDefault();

            var frCulture = CultureInfo.GetCultureInfo("fr-FR");
            var monthlyEvolution = new List<MonthlyTotalDto>();
            for (int i = 5; i >= 0; i--)
            {
                var monthDate = now.AddMonths(-i);
                var monthTotal = factures
                    .Where(f => f.InvoiceDate.Year == monthDate.Year && f.InvoiceDate.Month == monthDate.Month)
                    .Sum(f => f.MontantTtc);

                var abbrev = frCulture.DateTimeFormat.GetAbbreviatedMonthName(monthDate.Month);
                monthlyEvolution.Add(new MonthlyTotalDto
                {
                    Month = char.ToUpper(abbrev[0]) + abbrev[1..].Replace(".", ""),
                    Total = monthTotal
                });
            }

            var recentFactures = factures
                .OrderByDescending(f => f.CreatedAt)
                .Take(5)
                .Select(f => new RecentFactureDto
                {
                    Id = f.Id,
                    Merchant = f.Merchant,
                    InvoiceDate = f.InvoiceDate,
                    MontantTtc = f.MontantTtc,
                    Category = f.Category?.Name ?? "Non classee"
                })
                .ToList();

            var summary = new DashboardSummaryDto
            {
                TotalMonth = totalMonth,
                TotalFactures = facturesForSelectedMonth.Count,
                AverageAmount = averageAmount,
                TopCategory = topCategory?.Category ?? "Aucune",
                TopCategoryAmount = topCategory?.Total ?? 0,
                CategoryBreakdown = categoryBreakdown,
                MonthlyEvolution = monthlyEvolution,
                RecentFactures = recentFactures
            };

            return Ok(summary);
        }

        private int GetCurrentUserId()
        {
            var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (sub == null || !int.TryParse(sub, out var userId))
                throw new UnauthorizedAccessException("Utilisateur non authentifie.");

            return userId;
        }
    }
}