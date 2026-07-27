// ============================================================
// Smart Facture Tracker - AI Extraction & Classification
// Uses Gemini Flash (multimodal) to extract + classify factures
// Schema: merchant, date, montant_ht, tva_rate, montant_tva,
// montant_ttc, category - matches the prompt validated via
// PowerShell tests on the 4 sample invoices.
// ============================================================
// NuGet packages needed:
//   dotnet add package System.Text.Json   (already included in .NET)
// No AWS/Google SDK required - this uses plain HttpClient.
// ============================================================

using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using SmartFactureTracker.Models;

namespace SmartFactureTracker.Services
{
    // ---------------------------------------------------------
    // 1. DTO - the structured result we expect back from the AI
    //    (matches the JSON schema validated in PowerShell tests)
    // ---------------------------------------------------------
    public class ExtractedFactureDto
    {
        [JsonPropertyName("merchant")]
        public string? Merchant { get; set; }

        [JsonPropertyName("date")]
        public string? Date { get; set; } // kept as string first (safer parsing), converted later

        [JsonPropertyName("montant_ht")]
        public decimal? MontantHt { get; set; }

        [JsonPropertyName("tva_rate")]
        public decimal? TvaRate { get; set; }

        [JsonPropertyName("montant_tva")]
        public decimal? MontantTva { get; set; }

        [JsonPropertyName("montant_ttc")]
        public decimal? MontantTtc { get; set; }

        [JsonPropertyName("category")]
        public string? Category { get; set; }

        // Vrai si HT == TTC (TVA non detectee) - signal a l'utilisateur
        // de verifier manuellement avant de confirmer
        public bool NeedsManualReview =>
            MontantHt.HasValue && MontantTtc.HasValue &&
            Math.Abs(MontantHt.Value - MontantTtc.Value) < 0.01m;
    }

    // ---------------------------------------------------------
    // 2. Custom exception so the controller can react cleanly
    // ---------------------------------------------------------
    public class FactureExtractionException : Exception
    {
        public string? RawResponse { get; }

        public FactureExtractionException(string message, string? rawResponse = null, Exception? inner = null)
            : base(message, inner)
        {
            RawResponse = rawResponse;
        }
    }

    // ---------------------------------------------------------
    // 3. The service itself
    // ---------------------------------------------------------
    public interface IFactureAiService
    {
        Task<ExtractedFactureDto> ExtractAndClassifyAsync(byte[] fileBytes, string mimeType, CancellationToken ct = default);
    }

    public class FactureAiService : IFactureAiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private const string ModelEndpoint =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

        public FactureAiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Gemini:ApiKey"]
                ?? throw new InvalidOperationException("Gemini:ApiKey is missing from configuration.");
        }

        public async Task<ExtractedFactureDto> ExtractAndClassifyAsync(
            byte[] fileBytes, string mimeType, CancellationToken ct = default)
        {
            if (fileBytes == null || fileBytes.Length == 0)
                throw new ArgumentException("Le fichier est vide.", nameof(fileBytes));

            string base64File = Convert.ToBase64String(fileBytes);
            string prompt = BuildPrompt();

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new object[]
                        {
                            new
                            {
                                inline_data = new
                                {
                                    mime_type = mimeType,
                                    data = base64File
                                }
                            },
                            new { text = prompt }
                        }
                    }
                }
            };

            string jsonRequest = JsonSerializer.Serialize(requestBody);
            using var content = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

            string url = $"{ModelEndpoint}?key={_apiKey}";

            HttpResponseMessage response;
            try
            {
                response = await _httpClient.PostAsync(url, content, ct);
            }
            catch (HttpRequestException ex)
            {
                throw new FactureExtractionException("Impossible de contacter le service IA (Gemini).", null, ex);
            }

            string responseBody = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                throw new FactureExtractionException(
                    $"Le service IA a retourne une erreur ({(int)response.StatusCode}).",
                    responseBody);
            }

            string? rawText = ExtractTextFromGeminiResponse(responseBody);

            if (string.IsNullOrWhiteSpace(rawText))
            {
                throw new FactureExtractionException("Reponse vide du service IA.", responseBody);
            }

            string cleanJson = CleanJsonFences(rawText);

            ExtractedFactureDto? extracted;
            try
            {
                extracted = JsonSerializer.Deserialize<ExtractedFactureDto>(
                    cleanJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (JsonException ex)
            {
                throw new FactureExtractionException(
                    "Impossible d'interpreter la reponse JSON du service IA.",
                    rawText,
                    ex);
            }

            if (extracted == null)
            {
                throw new FactureExtractionException("Extraction vide ou invalide.", rawText);
            }

            return extracted;
        }

        // -----------------------------------------------------
        // Prompt sent to Gemini - extraction + classification
        // in a single call. Matches the version validated via
        // PowerShell tests (HT / TVA rate / TVA amount / TTC).
        // -----------------------------------------------------
        private static string BuildPrompt()
        {
            string categories = string.Join(", ", Enum.GetValues<FactureCategory>()
                .Select(c => c.ToDisplayName()));

            return $$"""
                Tu es un expert-comptable qui analyse des factures fournisseurs
                pour une entreprise textile.

                IMPORTANT: Une facture contient generalement deux zones distinctes
                contenant des montants:
                1. Un tableau de lignes de detail (articles/prestations), avec parfois
                   une colonne appelee "Montant HT" ou "Prix Unit." pour CHAQUE ligne.
                2. Un bloc de TOTAUX FINAUX, generalement situe en bas du document,
                   qui contient TROIS lignes distinctes: le Montant HT total, la TVA
                   (avec son taux), et le Montant TTC final (souvent en gras).

                Tu dois IGNORER les montants par ligne dans le tableau de detail, et
                extraire UNIQUEMENT les valeurs du bloc de totaux final en bas du
                document.

                Extrait les champs suivants:
                - merchant: nom du fournisseur
                - date: date de la facture (YYYY-MM-DD)
                - montant_ht: montant HT TOTAL (pas un montant de ligne)
                - tva_rate: taux de TVA en pourcentage
                - montant_tva: montant de la TVA
                - montant_ttc: montant TTC final
                - category: categorie choisie STRICTEMENT parmi cette liste : {{categories}}

                Si un champ est illisible ou absent, retourne null pour ce champ (sauf
                category, pour laquelle tu dois choisir "Autre" si aucune categorie ne
                correspond).

                Reponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant
                ou apres, exactement dans ce format :
                {"merchant": "", "date": "YYYY-MM-DD", "montant_ht": 0.0, "tva_rate": 0.0, "montant_tva": 0.0, "montant_ttc": 0.0, "category": ""}
                """;
        }

        // -----------------------------------------------------
        // Gemini wraps the answer inside candidates[0].content.parts[0].text
        // -----------------------------------------------------
        private static string? ExtractTextFromGeminiResponse(string responseBody)
        {
            using var doc = JsonDocument.Parse(responseBody);

            if (!doc.RootElement.TryGetProperty("candidates", out var candidates) ||
                candidates.GetArrayLength() == 0)
            {
                return null;
            }

            var firstCandidate = candidates[0];

            if (!firstCandidate.TryGetProperty("content", out var contentEl) ||
                !contentEl.TryGetProperty("parts", out var partsEl) ||
                partsEl.GetArrayLength() == 0)
            {
                return null;
            }

            var firstPart = partsEl[0];

            return firstPart.TryGetProperty("text", out var textEl)
                ? textEl.GetString()
                : null;
        }

        // -----------------------------------------------------
        // Gemini sometimes wraps JSON in ```json ... ``` fences
        // even when told not to - strip them defensively
        // -----------------------------------------------------
        private static string CleanJsonFences(string raw)
        {
            string cleaned = raw.Trim();

            if (cleaned.StartsWith("```"))
            {
                int firstNewline = cleaned.IndexOf('\n');
                if (firstNewline != -1)
                    cleaned = cleaned[(firstNewline + 1)..];

                int lastFence = cleaned.LastIndexOf("```", StringComparison.Ordinal);
                if (lastFence != -1)
                    cleaned = cleaned[..lastFence];
            }

            return cleaned.Trim();
        }
    }
}