namespace SmartFactureTracker.Models
{
    public enum FactureCategory
    {
        MatieresPremieres,
        AccessoiresEtGarnitures,
        Emballage,
        TransportEtLogistique,
        MachinesEtEquipements,
        MaintenanceEtReparations,
        Utilites,
        FournituresDeBureau,
        ServicesProfessionnels,
        LoyerEtInstallations,
        MarketingEtVentes,
        TaxesEtFraisAdministratifs,
        Autre
    }

    // Mapping helper - correspond aux libelles utilises dans le prompt IA
    // et affiches cote frontend (garde une seule source de verite)
    public static class FactureCategoryExtensions
    {
        public static string ToDisplayName(this FactureCategory category) => category switch
        {
            FactureCategory.MatieresPremieres => "Matieres premieres",
            FactureCategory.AccessoiresEtGarnitures => "Accessoires et garnitures",
            FactureCategory.Emballage => "Emballage",
            FactureCategory.TransportEtLogistique => "Transport et logistique",
            FactureCategory.MachinesEtEquipements => "Machines et equipements",
            FactureCategory.MaintenanceEtReparations => "Maintenance et reparations",
            FactureCategory.Utilites => "Utilites",
            FactureCategory.FournituresDeBureau => "Fournitures de bureau",
            FactureCategory.ServicesProfessionnels => "Services professionnels",
            FactureCategory.LoyerEtInstallations => "Loyer et installations",
            FactureCategory.MarketingEtVentes => "Marketing et ventes",
            FactureCategory.TaxesEtFraisAdministratifs => "Taxes et frais administratifs",
            FactureCategory.Autre => "Autre",
            _ => "Autre"
        };

        // Utilise pour convertir la reponse texte de l'IA (Gemini) vers l'enum
        public static FactureCategory FromDisplayName(string? displayName)
        {
            if (string.IsNullOrWhiteSpace(displayName))
                return FactureCategory.Autre;

            foreach (FactureCategory cat in Enum.GetValues<FactureCategory>())
            {
                if (string.Equals(cat.ToDisplayName(), displayName, StringComparison.OrdinalIgnoreCase))
                    return cat;
            }
            return FactureCategory.Autre;
        }
    }
}
