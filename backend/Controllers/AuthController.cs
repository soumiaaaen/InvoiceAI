using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartFactureTracker.Data;
using SmartFactureTracker.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SmartFactureTracker.Controllers
{
    public class RegisterRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;

        // Categories tapees librement par l'utilisateur a l'inscription
        // (ex: "Loyer", "Matieres premieres", "Marketing"...). Au moins
        // une categorie est requise - pas de liste fixe par defaut.
        public List<string> Categories { get; set; } = new();
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
    }

    public class ProfileResponse
    {
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public decimal DefaultTvaRate { get; set; }
        public List<CategoryResponse> Categories { get; set; } = new();
    }

    public class UpdateProfileRequest
    {
        public string FullName { get; set; } = string.Empty;
        public decimal DefaultTvaRate { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        // POST api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { error = "Email et mot de passe sont requis." });

            if (request.Password.Length < 6)
                return BadRequest(new { error = "Le mot de passe doit contenir au moins 6 caracteres." });

            if (string.IsNullOrWhiteSpace(request.FullName))
                return BadRequest(new { error = "Le nom complet est requis." });

            // Nettoie la liste : trim, retire les vides, deduplique
            // (insensible a la casse) - au moins une categorie valide requise
            var cleanedCategories = (request.Categories ?? new List<string>())
                .Select(c => c?.Trim() ?? string.Empty)
                .Where(c => !string.IsNullOrWhiteSpace(c))
                .GroupBy(c => c.ToLowerInvariant())
                .Select(g => g.First())
                .ToList();

            if (cleanedCategories.Count == 0)
                return BadRequest(new { error = "Ajoutez au moins une categorie de depenses." });

            if (cleanedCategories.Any(c => c.Length > 100))
                return BadRequest(new { error = "Le nom d'une categorie doit faire moins de 100 caracteres." });

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();

            var emailExists = await _db.Users.AnyAsync(u => u.Email == normalizedEmail, ct);
            if (emailExists)
                return Conflict(new { error = "Un compte existe deja avec cet email." });

            var user = new User
            {
                Email = normalizedEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FullName = request.FullName.Trim(),
                CreatedAt = DateTime.UtcNow,
                EmailConfirmed = true
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync(ct); // necessaire pour obtenir user.Id avant de creer les categories

            var categories = cleanedCategories.Select(name => new Category
            {
                UserId = user.Id,
                Name = name,
                CreatedAt = DateTime.UtcNow
            });

            _db.Categories.AddRange(categories);
            await _db.SaveChangesAsync(ct);

            var token = GenerateJwtToken(user);

            return Ok(new AuthResponse
            {
                Token = token,
                Email = user.Email,
                FullName = user.FullName
            });
        }

        // POST api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { error = "Email et mot de passe sont requis." });

            var user = await _db.Users.FirstOrDefaultAsync(
                u => u.Email == request.Email.Trim().ToLowerInvariant(), ct);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Unauthorized(new { error = "Email ou mot de passe incorrect." });

            var token = GenerateJwtToken(user);

            return Ok(new AuthResponse
            {
                Token = token,
                Email = user.Email,
                FullName = user.FullName
            });
        }

        // GET api/auth/me
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetProfile(CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var user = await _db.Users.FindAsync(new object?[] { userId }, ct);
            if (user == null) return NotFound();

            var categories = await _db.Categories
                .Where(c => c.UserId == userId)
                .OrderBy(c => c.Name)
                .Select(c => new CategoryResponse { Id = c.Id, Name = c.Name })
                .ToListAsync(ct);

            return Ok(new ProfileResponse
            {
                Email = user.Email,
                FullName = user.FullName,
                DefaultTvaRate = user.DefaultTvaRate,
                Categories = categories
            });
        }

        // PUT api/auth/profile
        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(request.FullName))
                return BadRequest(new { error = "Le nom complet est requis." });

            if (request.DefaultTvaRate < 0 || request.DefaultTvaRate > 100)
                return BadRequest(new { error = "Le taux de TVA doit etre compris entre 0 et 100." });

            var user = await _db.Users.FindAsync(new object?[] { GetCurrentUserId() }, ct);
            if (user == null) return NotFound();

            user.FullName = request.FullName.Trim();
            user.DefaultTvaRate = request.DefaultTvaRate;
            await _db.SaveChangesAsync(ct);

            return Ok(new { message = "Profil mis a jour avec succes." });
        }

        // Note : la gestion des categories apres inscription (ajout,
        // renommage, suppression) se fait desormais via CategoriesController
        // (GET/POST/PUT/DELETE api/categories), pas ici.

        // POST api/auth/change-password
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
                return BadRequest(new { error = "Le nouveau mot de passe doit contenir au moins 6 caracteres." });

            var user = await _db.Users.FindAsync(new object?[] { GetCurrentUserId() }, ct);
            if (user == null) return NotFound();

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                return BadRequest(new { error = "Mot de passe actuel incorrect." });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _db.SaveChangesAsync(ct);

            return Ok(new { message = "Mot de passe modifie avec succes." });
        }

        private int GetCurrentUserId()
        {
            var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (sub == null || !int.TryParse(sub, out var userId))
                throw new UnauthorizedAccessException("Utilisateur non authentifie.");

            return userId;
        }

        private string GenerateJwtToken(User user)
        {
            var jwtKey = _config["Jwt:Key"]
                ?? throw new InvalidOperationException("Jwt:Key manquant dans la configuration.");
            var issuer = _config["Jwt:Issuer"];
            var audience = _config["Jwt:Audience"];
            var expiryMinutes = int.Parse(_config["Jwt:ExpiryMinutes"] ?? "60");

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("fullName", user.FullName),
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}