using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartFactureTracker.Data;
using SmartFactureTracker.Models;
using SmartFactureTracker.Services;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace SmartFactureTracker.Controllers
{
    public class ConfirmFactureRequest
    {
        public string Merchant { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty; // "YYYY-MM-DD"
        public decimal MontantHt { get; set; }
        public decimal TvaRate { get; set; }
        public decimal MontantTva { get; set; }
        public decimal MontantTtc { get; set; }
        public string? NumeroFacture { get; set; }
        // Nom de la categorie (texte libre) - doit correspondre a une
        // categorie existante de l'utilisateur, sinon la facture est
        // enregistree "non classee" plutot que rejetee.
        public string? Category { get; set; }
    }

    public class EditFactureRequest
    {
        public string Merchant { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty; // "YYYY-MM-DD"
        public decimal MontantHt { get; set; }
        public decimal TvaRate { get; set; }
        public decimal MontantTva { get; set; }
        public decimal MontantTtc { get; set; }
        public string? NumeroFacture { get; set; }
        public string? Category { get; set; }
    }

    public class FactureFiltersDto
    {
        public List<string> Categories { get; set; } = new();
        public List<string> Suppliers { get; set; } = new();
    }

    [ApiController]
    [Route("api/factures")]
    [Authorize]
    public class FacturesController : ControllerBase
    {
        private readonly IFactureAiService _aiService;
        private readonly AppDbContext _db;
        private readonly IWebHostEnvironment _env;

        private static readonly string[] AllowedMimeTypes =
        {
            "application/pdf", "image/jpeg", "image/png"
        };

        private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

        public FacturesController(IFactureAiService aiService, AppDbContext db, IWebHostEnvironment env)
        {
            _aiService = aiService;
            _db = db;
            _env = env;
        }

        // POST api/factures/extract
        [HttpPost("extract")]
        public async Task<IActionResult> ExtractFromFile(IFormFile file, CancellationToken ct)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { error = "Aucun fichier recu." });

            if (file.Length > MaxFileSizeBytes)
                return BadRequest(new { error = "Fichier trop volumineux (max 10 MB)." });

            if (!AllowedMimeTypes.Contains(file.ContentType))
                return BadRequest(new { error = "Type de fichier non supporte. Utilisez PDF, JPEG ou PNG." });

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream, ct);
            byte[] fileBytes = memoryStream.ToArray();

            // Utilise uniquement les categories creees par l'utilisateur
            // pour la classification IA (texte libre, plus d'enum fixe)
            int currentUserId = GetCurrentUserId();
            var categoryNames = await _db.Categories
                .Where(c => c.UserId == currentUserId)
                .Select(c => c.Name)
                .ToListAsync(ct);

            try
            {
                var result = await _aiService.ExtractAndClassifyAsync(fileBytes, file.ContentType, categoryNames, ct);
                return Ok(result);
            }
            catch (FactureExtractionException ex)
            {
                return StatusCode(502, new
                {
                    error = "Echec de l'extraction automatique.",
                    detail = ex.Message
                });
            }
        }

        // POST api/factures
        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> ConfirmFacture(
            [FromForm] ConfirmFactureRequest request,
            IFormFile? file,
            CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(request.Merchant))
                return BadRequest(new { error = "Le nom du fournisseur est requis." });

            if (!DateTime.TryParse(request.Date, CultureInfo.InvariantCulture, DateTimeStyles.None, out var invoiceDate))
                return BadRequest(new { error = "Date invalide." });

            if (file != null && file.Length > MaxFileSizeBytes)
                return BadRequest(new { error = "Fichier trop volumineux (max 10 MB)." });

            if (file != null && !AllowedMimeTypes.Contains(file.ContentType))
                return BadRequest(new { error = "Type de fichier non supporte. Utilisez PDF, JPEG ou PNG." });

            int currentUserId = GetCurrentUserId();

            int? categoryId = await ResolveCategoryIdAsync(currentUserId, request.Category, ct);

            string? savedRelativePath = null;

            if (file != null && file.Length > 0)
            {
                var uploadsPath = Path.Combine(_env.ContentRootPath, "uploads");
                Directory.CreateDirectory(uploadsPath);

                var safeExt = Path.GetExtension(file.FileName);
                var uniqueName = $"{Guid.NewGuid()}{safeExt}";
                var fullPath = Path.Combine(uploadsPath, uniqueName);

                await using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream, ct);
                }

                savedRelativePath = $"/uploads/{uniqueName}";
            }

            var facture = new Facture
            {
                Merchant = request.Merchant,
                InvoiceDate = invoiceDate,
                MontantHt = request.MontantHt,
                TvaRate = request.TvaRate,
                MontantTva = request.MontantTva,
                MontantTtc = request.MontantTtc,
                NumeroFacture = request.NumeroFacture,
                CategoryId = categoryId,
                ReceiptFilePath = savedRelativePath,
                UserId = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Factures.Add(facture);
            await _db.SaveChangesAsync(ct);

            return Ok(new { id = facture.Id, message = "Facture enregistree avec succes." });
        }

        // GET api/factures?search=...&category=...&month=1-12&fournisseur=...
        [HttpGet]
        public async Task<IActionResult> GetFactures(
            [FromQuery] string? search,
            [FromQuery] string? category,
            [FromQuery] int? month,
            [FromQuery] string? fournisseur,
            CancellationToken ct)
        {
            int currentUserId = GetCurrentUserId();
            var query = _db.Factures.Where(f => f.UserId == currentUserId).AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(f => f.Merchant.Contains(search));

            if (!string.IsNullOrWhiteSpace(category))
                query = query.Where(f => f.Category != null && f.Category.Name == category);

            if (month is >= 1 and <= 12)
                query = query.Where(f => f.InvoiceDate.Month == month.Value);

            if (!string.IsNullOrWhiteSpace(fournisseur))
                query = query.Where(f => f.Merchant == fournisseur);

            var factures = await query
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new
                {
                    f.Id,
                    f.Merchant,
                    f.InvoiceDate,
                    f.MontantHt,
                    f.TvaRate,
                    f.MontantTva,
                    f.MontantTtc,
                    f.NumeroFacture,
                    Category = f.Category != null ? f.Category.Name : "Non classee",
                    f.ReceiptFilePath
                })
                .ToListAsync(ct);

            return Ok(factures);
        }

        // GET api/factures/filters
        // Renvoie toutes les categories de l'utilisateur (pas seulement
        // celles deja utilisees) pour que le filtre reste a jour des
        // qu'une categorie est creee, meme sans facture encore associee.
        [HttpGet("filters")]
        public async Task<IActionResult> GetFilters(CancellationToken ct)
        {
            int currentUserId = GetCurrentUserId();

            var categories = await _db.Categories
                .Where(c => c.UserId == currentUserId)
                .OrderBy(c => c.Name)
                .Select(c => c.Name)
                .ToListAsync(ct);

            var suppliers = await _db.Factures
                .Where(f => f.UserId == currentUserId)
                .Select(f => f.Merchant)
                .Distinct()
                .ToListAsync(ct);

            var result = new FactureFiltersDto
            {
                Categories = categories,
                Suppliers = suppliers.OrderBy(s => s).ToList()
            };

            return Ok(result);
        }

        // PUT api/factures/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateFacture(int id, [FromBody] EditFactureRequest request, CancellationToken ct)
        {
            int currentUserId = GetCurrentUserId();

            var facture = await _db.Factures.FindAsync(new object?[] { id }, ct);
            if (facture == null || facture.UserId != currentUserId)
                return NotFound(new { error = "Facture introuvable." });

            if (string.IsNullOrWhiteSpace(request.Merchant))
                return BadRequest(new { error = "Le nom du fournisseur est requis." });

            if (!DateTime.TryParse(request.Date, CultureInfo.InvariantCulture, DateTimeStyles.None, out var invoiceDate))
                return BadRequest(new { error = "Date invalide." });

            facture.Merchant = request.Merchant;
            facture.InvoiceDate = invoiceDate;
            facture.MontantHt = request.MontantHt;
            facture.TvaRate = request.TvaRate;
            facture.MontantTva = request.MontantTva;
            facture.MontantTtc = request.MontantTtc;
            facture.NumeroFacture = request.NumeroFacture;
            facture.CategoryId = await ResolveCategoryIdAsync(currentUserId, request.Category, ct);
            facture.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(ct);

            return Ok(new { message = "Facture mise a jour avec succes." });
        }

        // DELETE api/factures/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteFacture(int id, CancellationToken ct)
        {
            int currentUserId = GetCurrentUserId();

            var facture = await _db.Factures.FindAsync(new object?[] { id }, ct);
            if (facture == null || facture.UserId != currentUserId)
                return NotFound(new { error = "Facture introuvable." });

            if (!string.IsNullOrWhiteSpace(facture.ReceiptFilePath))
            {
                var fileName = Path.GetFileName(facture.ReceiptFilePath);
                var fullPath = Path.Combine(_env.ContentRootPath, "uploads", fileName);
                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                }
            }

            _db.Factures.Remove(facture);
            await _db.SaveChangesAsync(ct);

            return Ok(new { message = "Facture supprimee avec succes." });
        }

        // Retrouve l'Id de la categorie de l'utilisateur correspondant au
        // nom recu (insensible a la casse). Renvoie null si aucun nom
        // n'est fourni ou si aucune categorie ne correspond - la facture
        // est alors enregistree "non classee" plutot que rejetee.
        private async Task<int?> ResolveCategoryIdAsync(int userId, string? categoryName, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(categoryName))
                return null;

            var category = await _db.Categories.FirstOrDefaultAsync(
                c => c.UserId == userId && c.Name.ToLower() == categoryName.ToLower(), ct);

            return category?.Id;
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