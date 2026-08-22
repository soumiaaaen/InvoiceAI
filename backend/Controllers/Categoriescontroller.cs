using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartFactureTracker.Data;
using SmartFactureTracker.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace SmartFactureTracker.Controllers
{
    public class CategoryResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class CreateCategoryRequest
    {
        public string Name { get; set; } = string.Empty;
    }

    public class UpdateCategoryRequest
    {
        public string Name { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/categories")]
    [Authorize]
    public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public CategoriesController(AppDbContext db)
        {
            _db = db;
        }

        // GET api/categories
        [HttpGet]
        public async Task<IActionResult> GetAll(CancellationToken ct)
        {
            var categories = await _db.Categories
                .Where(c => c.UserId == GetCurrentUserId())
                .OrderBy(c => c.Name)
                .Select(c => new CategoryResponse { Id = c.Id, Name = c.Name })
                .ToListAsync(ct);

            return Ok(categories);
        }

        // POST api/categories
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request, CancellationToken ct)
        {
            var name = request.Name?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { error = "Le nom de la categorie est requis." });

            if (name.Length > 100)
                return BadRequest(new { error = "Le nom de la categorie doit faire moins de 100 caracteres." });

            var userId = GetCurrentUserId();

            var exists = await _db.Categories.AnyAsync(
                c => c.UserId == userId && c.Name.ToLower() == name.ToLower(), ct);
            if (exists)
                return Conflict(new { error = "Une categorie avec ce nom existe deja." });

            var category = new Category
            {
                UserId = userId,
                Name = name,
                CreatedAt = DateTime.UtcNow
            };

            _db.Categories.Add(category);
            await _db.SaveChangesAsync(ct);

            return Ok(new CategoryResponse { Id = category.Id, Name = category.Name });
        }

        // PUT api/categories/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateCategoryRequest request, CancellationToken ct)
        {
            var name = request.Name?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { error = "Le nom de la categorie est requis." });

            var userId = GetCurrentUserId();

            var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId, ct);
            if (category == null)
                return NotFound();

            var duplicate = await _db.Categories.AnyAsync(
                c => c.UserId == userId && c.Id != id && c.Name.ToLower() == name.ToLower(), ct);
            if (duplicate)
                return Conflict(new { error = "Une categorie avec ce nom existe deja." });

            category.Name = name;
            await _db.SaveChangesAsync(ct);

            return Ok(new CategoryResponse { Id = category.Id, Name = category.Name });
        }

        // DELETE api/categories/{id}
        // Les factures liees a cette categorie repassent a "non categorisees"
        // (CategoryId = null) plutot que d'etre supprimees ou bloquees -
        // gere automatiquement par le DeleteBehavior.SetNull sur la FK.
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var userId = GetCurrentUserId();

            var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId, ct);
            if (category == null)
                return NotFound();

            _db.Categories.Remove(category);
            await _db.SaveChangesAsync(ct);

            return Ok(new { message = "Categorie supprimee." });
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