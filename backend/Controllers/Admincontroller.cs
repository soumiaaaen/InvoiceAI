using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartFactureTracker.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace SmartFactureTracker.Controllers
{
    public class AdminStatsResponse
    {
        public int TotalUsers { get; set; }
        public int TotalFactures { get; set; }
        public decimal TotalMontantTtc { get; set; }
        // Estimation basee sur le cout mesure experimentalement dans le
        // rapport (~0,01 $ par facture avec Gemini 3.5 Flash) - ce n'est
        // PAS un cout reel trace par facture, juste une estimation globale.
        public decimal EstimatedApiCostUsd { get; set; }
    }

    public class AdminUserResponse
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = "User";
        public DateTime CreatedAt { get; set; }
        public int FactureCount { get; set; }
    }

    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _db;

        // Cout moyen mesure par facture (voir chapitre Realisation du
        // rapport - mesure experimentale avec Gemini 3.5 Flash).
        private const decimal EstimatedCostPerFacture = 0.01m;

        public AdminController(AppDbContext db)
        {
            _db = db;
        }

        // GET api/admin/stats
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats(CancellationToken ct)
        {
            var totalUsers = await _db.Users.CountAsync(ct);
            var totalFactures = await _db.Factures.CountAsync(ct);
            var totalMontantTtc = await _db.Factures.SumAsync(f => (decimal?)f.MontantTtc, ct) ?? 0;

            return Ok(new AdminStatsResponse
            {
                TotalUsers = totalUsers,
                TotalFactures = totalFactures,
                TotalMontantTtc = totalMontantTtc,
                EstimatedApiCostUsd = totalFactures * EstimatedCostPerFacture
            });
        }

        // GET api/admin/users
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(CancellationToken ct)
        {
            var users = await _db.Users
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new AdminUserResponse
                {
                    Id = u.Id,
                    Email = u.Email,
                    FullName = u.FullName,
                    Role = u.Role,
                    CreatedAt = u.CreatedAt,
                    FactureCount = u.Factures.Count
                })
                .ToListAsync(ct);

            return Ok(users);
        }

        // DELETE api/admin/users/{id}
        // Supprime un compte utilisateur (et, par cascade EF Core, ses
        // factures et categories). Un admin ne peut pas se supprimer
        // lui-meme via cet endpoint.
        [HttpDelete("users/{id:int}")]
        public async Task<IActionResult> DeleteUser(int id, CancellationToken ct)
        {
            if (id == GetCurrentUserId())
                return BadRequest(new { error = "Vous ne pouvez pas supprimer votre propre compte depuis cette page." });

            var user = await _db.Users.FindAsync(new object?[] { id }, ct);
            if (user == null)
                return NotFound(new { error = "Utilisateur introuvable." });

            _db.Users.Remove(user);
            await _db.SaveChangesAsync(ct);

            return Ok(new { message = "Utilisateur supprime avec succes." });
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