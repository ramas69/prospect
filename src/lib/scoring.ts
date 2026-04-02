/**
 * Calcule un score de qualification (0-100) pour un prospect
 * basé sur les données Google Maps + enrichissement Pappers.
 */

interface ProspectForScoring {
  email?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviews_count?: number;
  employee_range?: string;
  revenue?: number;
  capital?: number;
  siret?: string;
}

export function calculateLeadScore(prospect: ProspectForScoring): number {
  let score = 0;

  // Contact (max 30 pts)
  if (prospect.email) score += 15;
  if (prospect.phone) score += 10;
  if (prospect.website) score += 5;

  // Réputation Google (max 20 pts)
  if (prospect.rating) {
    if (prospect.rating >= 4.5) score += 10;
    else if (prospect.rating >= 4.0) score += 7;
    else if (prospect.rating >= 3.5) score += 4;
  }
  if (prospect.reviews_count) {
    if (prospect.reviews_count >= 500) score += 10;
    else if (prospect.reviews_count >= 100) score += 7;
    else if (prospect.reviews_count >= 20) score += 4;
    else score += 1;
  }

  // Données entreprise (max 30 pts)
  if (prospect.siret) score += 5;
  if (prospect.employee_range) score += 10;
  if (prospect.revenue) {
    if (prospect.revenue >= 1_000_000) score += 15;
    else if (prospect.revenue >= 500_000) score += 10;
    else if (prospect.revenue >= 100_000) score += 5;
    else score += 2;
  }

  // Solidité (max 20 pts)
  if (prospect.capital) {
    if (prospect.capital >= 100_000) score += 15;
    else if (prospect.capital >= 10_000) score += 10;
    else score += 5;
  }

  return Math.min(100, score);
}

export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
  if (score >= 40) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
  return 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
}

export function getScoreLabel(score: number): string {
  if (score >= 70) return 'Excellent';
  if (score >= 50) return 'Bon';
  if (score >= 30) return 'Moyen';
  return 'Faible';
}
