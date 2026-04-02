import { supabase } from './supabase';

const API_URL = 'https://recherche-entreprises.api.gouv.fr/search';

// Tranches d'effectifs INSEE
const EMPLOYEE_RANGES: Record<string, string> = {
  '00': '0 salarié',
  '01': '1 ou 2 salariés',
  '02': '3 à 5 salariés',
  '03': '6 à 9 salariés',
  '11': '10 à 19 salariés',
  '12': '20 à 49 salariés',
  '21': '50 à 99 salariés',
  '22': '100 à 199 salariés',
  '31': '200 à 249 salariés',
  '32': '250 à 499 salariés',
  '41': '500 à 999 salariés',
  '42': '1 000 à 1 999 salariés',
  '51': '2 000 à 4 999 salariés',
  '52': '5 000 à 9 999 salariés',
  '53': '10 000 salariés et plus',
};

export interface EnrichmentData {
  siren?: string;
  siret?: string;
  employee_range?: string;
  revenue?: number;
  revenue_year?: string;
  net_income?: number;
  company_category?: string;
  naf_code?: string;
  directors?: any[];
  capital?: number;
  legal_form?: string;
  enriched_at: string;
}

/**
 * Recherche une entreprise via l'API recherche-entreprises.api.gouv.fr
 * et retourne les données d'enrichissement.
 */
export async function searchEntreprise(
  businessName: string,
  city?: string
): Promise<EnrichmentData | null> {
  try {
    const query = city
      ? `${businessName} ${city}`
      : businessName;

    const params = new URLSearchParams({
      q: query,
      page: '1',
      per_page: '1',
    });

    const response = await fetch(`${API_URL}?${params}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.results || data.results.length === 0) return null;

    const company = data.results[0];

    // Récupérer le CA le plus récent
    let revenue: number | undefined;
    let revenueYear: string | undefined;
    let netIncome: number | undefined;

    if (company.finances) {
      const years = Object.keys(company.finances).sort((a, b) => b.localeCompare(a));
      if (years.length > 0) {
        revenueYear = years[0];
        revenue = company.finances[revenueYear]?.ca ?? undefined;
        netIncome = company.finances[revenueYear]?.resultat_net ?? undefined;
      }
    }

    // Traduire la tranche d'effectifs
    const rawRange = company.tranche_effectif_salarie || company.siege?.tranche_effectif_salarie;
    const employeeRange = rawRange ? (EMPLOYEE_RANGES[rawRange] || `Code ${rawRange}`) : undefined;

    return {
      siren: company.siren || undefined,
      siret: company.siege?.siret || undefined,
      employee_range: employeeRange,
      revenue,
      revenue_year: revenueYear,
      net_income: netIncome,
      company_category: company.categorie_entreprise || undefined,
      naf_code: company.activite_principale || undefined,
      directors: company.dirigeants || undefined,
      enriched_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Erreur enrichissement entreprise:', error);
    return null;
  }
}

/**
 * Enrichit un prospect par son ID en BDD.
 */
export async function enrichProspect(
  prospectId: string,
  businessName: string,
  city?: string
): Promise<EnrichmentData | null> {
  const data = await searchEntreprise(businessName, city);
  if (!data) return null;

  const { error } = await supabase
    .from('scraping_results')
    .update(data)
    .eq('id', prospectId);

  if (error) {
    console.error('Erreur sauvegarde enrichissement:', error);
    return null;
  }

  return data;
}

/**
 * Enrichit tous les prospects non enrichis d'une session.
 */
export async function enrichSessionProspects(sessionId: string): Promise<number> {
  const { data: prospects } = await supabase
    .from('scraping_results')
    .select('id, business_name, address')
    .eq('session_id', sessionId)
    .is('enriched_at', null);

  if (!prospects || prospects.length === 0) return 0;

  let enrichedCount = 0;

  for (const prospect of prospects) {
    // Extraire la ville de l'adresse
    const city = prospect.address?.split(',').pop()?.trim();

    const result = await enrichProspect(prospect.id, prospect.business_name, city);
    if (result) enrichedCount++;

    // Petit délai pour ne pas surcharger l'API
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return enrichedCount;
}

/**
 * Formate le CA pour l'affichage
 */
export function formatRevenue(revenue: number | null): string {
  if (revenue === null || revenue === undefined) return 'N/A';
  if (revenue >= 1_000_000) return `${(revenue / 1_000_000).toFixed(1)} M€`;
  if (revenue >= 1_000) return `${(revenue / 1_000).toFixed(0)} k€`;
  return `${revenue} €`;
}
