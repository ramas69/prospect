import { X, MapPin, Phone, Mail, Globe, Star, Clock, ExternalLink, Info, CheckCircle2, Building2, Wallet, Accessibility, Dog, Baby, Car } from 'lucide-react';
import ProspectTimeline from './ProspectTimeline';

interface BusinessDetails {
  row_number?: number;
  'Nom de catégorie'?: string;
  'URL Google Maps'?: string;
  Titre?: string;
  Rue?: string;
  Ville?: string;
  'Code postal'?: number;
  Email?: string;
  'Site web'?: string;
  Téléphone?: number | string;
  'Score total'?: number;
  "Nombre d'avis"?: number;
  "Heures d'ouverture"?: string;
  Infos?: string;
  Résumé?: string;
}

interface BusinessDetailsModalProps {
  business: BusinessDetails;
  prospectId?: string;
  onClose: () => void;
}

export default function BusinessDetailsModal({ business, prospectId, onClose }: BusinessDetailsModalProps) {
  let openingHours: Array<{ day: string; hours: string }> = [];
  let businessInfo: Record<string, any> = {};

  // Improved parsing logic that handles both JSON strings and already-parsed objects
  try {
    const rawHours = business["Heures d'ouverture"];
    if (typeof rawHours === 'string') {
      openingHours = JSON.parse(rawHours);
    } else if (Array.isArray(rawHours)) {
      openingHours = rawHours;
    }
  } catch (e) {
    console.error('Error parsing opening hours:', e);
  }

  try {
    const rawInfos = business.Infos;
    if (typeof rawInfos === 'string') {
      businessInfo = JSON.parse(rawInfos);
    } else if (typeof rawInfos === 'object' && rawInfos !== null) {
      businessInfo = rawInfos;
    }
  } catch (e) {
    console.error('Error parsing business info:', e);
  }

  const formatPhone = (phone?: number | string) => {
    if (!phone) return null;
    const phoneStr = typeof phone === 'number' ? `+${phone}` : phone;
    return phoneStr;
  };

  const getIconForSection = (title: string) => {
    switch (title.toLowerCase()) {
      case 'accessibilité': return Accessibility;
      case 'paiements': return Wallet;
      case 'animaux de compagnie': return Dog;
      case 'enfants': return Baby;
      case 'parking': return Car;
      case 'points forts': return CheckCircle2;
      default: return Info;
    }
  };

  const renderInfoSection = (title: string, items: any) => {
    if (!items) return null;

    let trueItems: string[] = [];

    if (Array.isArray(items)) {
      const first = items[0];
      if (typeof first === 'string') {
        trueItems = items as string[];
      } else if (typeof first === 'object') {
        trueItems = items.filter(item => {
          const value = Object.values(item)[0];
          return value === true;
        }).map(item => Object.keys(item)[0]);
      }
    } else if (typeof items === 'object') {
      // Handle object where keys are the items and values are booleans
      trueItems = Object.entries(items)
        .filter(([_, val]) => val === true)
        .map(([key, _]) => key);
    }

    if (trueItems.length === 0) return null;

    const Icon = getIconForSection(title);

    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 uppercase tracking-wider">
          <Icon className="w-4 h-4 text-orange-500" />
          {title}
        </h4>
        <div className="flex flex-wrap gap-2">
          {trueItems.map((item, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 rounded-lg shadow-sm"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Keywords to filter out from "Technical Data" as they are already shown
  const shownKeys = new Set([
    'Titre', 'Nom de catégorie', 'URL Google Maps', 'Rue', 'Ville', 'Code postal',
    'Téléphone', 'Email', 'Site web', 'Score total', "Nombre d'avis",
    "Heures d'ouverture", 'Infos', 'row_number', 'Résumé'
  ]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* HEADER */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-2xl">
              <Building2 className="w-8 h-8 text-orange-600 dark:text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {business.Titre || 'Prospect sans nom'}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {business['Nom de catégorie'] && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-semibold border border-blue-100 dark:border-blue-800">
                    {business['Nom de catégorie']}
                  </span>
                )}
                <span className="text-gray-300 dark:text-gray-700">•</span>
                {business['Score total'] ? (
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{business['Score total']}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">({business["Nombre d'avis"]} avis)</span>
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs italic">Aucun avis</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT COLUMN: MAIN CONTACT INFOS */}
            <div className="lg:col-span-2 space-y-8">

              {/* Contact Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start gap-4 hover:border-orange-200 dark:hover:border-orange-900/50 transition-colors group">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-gray-400 group-hover:text-orange-500 transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-0.5">Téléphone</p>
                    {business.Téléphone ? (
                      <a href={`tel:${formatPhone(business.Téléphone)}`} className="text-base font-semibold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                        {formatPhone(business.Téléphone)}
                      </a>
                    ) : <span className="text-gray-400 italic">Non renseigné</span>}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start gap-4 hover:border-orange-200 dark:hover:border-orange-900/50 transition-colors group">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-gray-400 group-hover:text-orange-500 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-0.5">Email</p>
                    {business.Email && business.Email !== 'aucun_mail' ? (
                      <a href={`mailto:${business.Email}`} className="text-base font-semibold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors truncate block">
                        {business.Email}
                      </a>
                    ) : <span className="text-gray-400 italic">Non renseigné</span>}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start gap-4 hover:border-orange-200 dark:hover:border-orange-900/50 transition-colors group">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-gray-400 group-hover:text-orange-500 transition-colors">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-0.5">Site Web</p>
                    {business['Site web'] ? (
                      <a href={business['Site web']} target="_blank" rel="noreferrer" className="text-base font-semibold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors truncate block">
                        {business['Site web'].replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    ) : <span className="text-gray-400 italic">Non renseigné</span>}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start gap-4 hover:border-orange-200 dark:hover:border-orange-900/50 transition-colors group">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-gray-400 group-hover:text-orange-500 transition-colors">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-0.5">Adresse</p>
                    {(business.Rue || business.Ville) ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white leading-tight mb-1">
                          {[business.Rue, business['Code postal'], business.Ville].filter(Boolean).join(', ')}
                        </span>
                        {business['URL Google Maps'] && (
                          <a href={business['URL Google Maps']} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                            Voir sur la carte <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ) : <span className="text-gray-400 italic">Non renseignée</span>}
                  </div>
                </div>
              </div>

              {/* Summary / About Section - Prominent placement */}
              {business.Résumé && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-3">
                    <Info className="w-5 h-5 text-blue-500" />
                    À propos
                  </h3>
                  <div className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-line text-justify">
                    {business.Résumé.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
                      if (part.match(/https?:\/\/[^\s]+/)) {
                        return (
                          <a
                            key={i}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-500 hover:text-orange-600 hover:underline font-bold break-all"
                          >
                            {part}
                          </a>
                        );
                      }
                      return part;
                    })}
                  </div>
                </div>
              )}

              {/* Qualifiers & Highlights */}
              {Object.keys(businessInfo).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Points clés & Services</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInfoSection('Points forts', businessInfo['Points forts'])}
                    {renderInfoSection('Services', businessInfo['Services'])}
                    {renderInfoSection('Offre', businessInfo['Offre'])}
                    {renderInfoSection('Accessibilité', businessInfo['Accessibilité'])}
                    {renderInfoSection('Paiements', businessInfo['Paiements'])}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: OPERATIONAL & TECH */}
            <div className="space-y-8">

              {/* Opening Hours */}
              {openingHours.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <h3 className="font-bold text-gray-900 dark:text-white">Horaires d'ouverture</h3>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {openingHours.map((slot, idx) => {
                      const currentDay = new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
                      const isToday = slot.day.toLowerCase() === currentDay;
                      const isClosed = slot.hours.toLowerCase().includes('fermé') || slot.hours.toLowerCase().includes('closed');
                      // Format hours: replace " to " with " - "
                      // Split by comma to handle multiple slots (e.g. lunch & dinner)
                      const hoursParts = slot.hours.replace(/ to /g, ' - ').split(', ');

                      return (
                        <div
                          key={idx}
                          className={`
                                            flex flex-row items-start gap-4 p-3 text-sm transition-colors
                                            ${isToday ? 'bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-500 pl-2' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 border-l-4 border-transparent pl-3'}
                                        `}
                        >
                          <span className={`w-24 font-bold capitalize flex-shrink-0 pt-0.5 ${isToday ? 'text-orange-700 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {slot.day} {isToday && <span className="text-[10px] ml-1 uppercase text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded-full inline-block mt-1">Auj.</span>}
                          </span>
                          <div className={`flex-1 flex flex-col items-end sm:items-start ${isClosed ? 'text-red-500 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                            {isClosed ? (
                              <span>Fermé</span>
                            ) : (
                              hoursParts.map((part, partIdx) => (
                                <span key={partIdx} className="block whitespace-nowrap">
                                  {part}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Additional Technical Info (The "Etc" part) */}
              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Autres Informations
                </h3>
                <div className="space-y-4">
                  {Object.entries(business)
                    .filter(([key]) => !shownKeys.has(key))
                    .map(([key, value]) => {
                      let displayVal = String(value);
                      if (value === null || value === undefined) return null;
                      if (typeof value === 'object') displayVal = "Détails complexes";

                      return (
                        <div key={key} className="flex flex-col gap-1 text-sm bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700/50">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300 break-words leading-relaxed">{displayVal}</span>
                        </div>
                      );
                    })
                  }
                  {/* Fallback if everything is shown */}
                  {Object.entries(business).filter(([key]) => !shownKeys.has(key)).length === 0 && (
                    <span className="text-xs text-center block text-gray-400 italic py-2">Aucune autre donnée technique disponible.</span>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* TIMELINE SECTION - Full Width */}
        {prospectId && (
          <div className="px-6 pb-6">
            <ProspectTimeline prospectId={prospectId} />
          </div>
        )}

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-bold transition-all"
            >
              Fermer
            </button>
            {/* Future action buttons could go here (Add to CRM, etc.) */}
          </div>
        </div>

      </div>
    </div>
  );
}
