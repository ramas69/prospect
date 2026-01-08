import { useState, useEffect } from 'react';
import { Search, Link as LinkIcon, Mail, FileSpreadsheet } from 'lucide-react';
import MapPreview from './MapPreview';
import { useModal } from '../contexts/ModalContext';

export interface ProspectionFormData {
  lienGoogleMaps: string;
  secteurActivite: string;
  limitResultats: number;
  emailNotification: string;
  nouveauFichier: boolean;
  nomFichier: string;
  nomFeuille: string;
  urlFichier: string;
  location?: string;
}

interface ProspectionFormProps {
  onSubmit: (data: ProspectionFormData) => void;
  isLoading: boolean;
  initialData?: Partial<ProspectionFormData>;
  hideEmail?: boolean;
  hideSheetUrl?: boolean;
}

export default function ProspectionForm({ 
  onSubmit, 
  isLoading, 
  initialData, 
  hideEmail = false, 
  hideSheetUrl = false 
}: ProspectionFormProps) {
  const { showAlert } = useModal();
  const [formData, setFormData] = useState<ProspectionFormData>({
    lienGoogleMaps: '',
    secteurActivite: '',
    limitResultats: 10,
    emailNotification: '',
    nouveauFichier: false,
    nomFichier: '',
    nomFeuille: '',
    urlFichier: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lienGoogleMaps.includes('google.com/maps')) {
      showAlert('Lien invalide', 'Veuillez entrer un lien Google Maps valide pour commencer le scraping.', 'warning');
      return;
    }

    if (formData.nouveauFichier && !formData.nomFichier.trim()) {
      showAlert('Nom manquant', 'Veuillez entrer un nom pour votre nouveau fichier Google Sheets.', 'warning');
      return;
    }

    onSubmit(formData);
  };

  const updateField = (field: keyof ProspectionFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleZoneSelect = (data: { lat: number; lng: number; radius: number; googleMapsUrl: string; cityName?: string }) => {
    if (data.googleMapsUrl) {
      updateField('lienGoogleMaps', data.googleMapsUrl);
      
      // Si on a une ville et un rayon, on crée une chaîne lisible pour le champ location
      if (data.cityName) {
        const radiusKm = (data.radius / 1000).toFixed(1);
        updateField('location', `${data.cityName} (${radiusKm} km)`);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg p-8 space-y-8">
      <div className="flex items-start gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur-md opacity-50"></div>
          <div className="relative p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
            <Search className="w-7 h-7 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Configuration du scraping</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Extrayez automatiquement les leads depuis Google Maps avec recherche d'emails
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <MapPreview 
          onZoneSelect={handleZoneSelect} 
          searchTerm={formData.secteurActivite} 
          locationQuery={formData.location}
        />

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Lien google maps <span className="text-orange-500">*</span>
          </label>
          <div className="relative group">
            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="url"
              value={formData.lienGoogleMaps}
              onChange={(e) => updateField('lienGoogleMaps', e.target.value)}
              placeholder="Collez un lien Google Maps ou sélectionnez une zone ci-dessus"
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Secteur activité <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              value={formData.secteurActivite}
              onChange={(e) => updateField('secteurActivite', e.target.value)}
              placeholder="ex: Agence immobilière"
              className="w-full px-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Limit de résultats <span className="text-orange-500">*</span>
            </label>
            <input
              type="number"
              value={formData.limitResultats}
              onChange={(e) => updateField('limitResultats', Number(e.target.value))}
              min={1}
              max={500}
              className="w-full px-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
              required
            />
          </div>
        </div>

        {!hideEmail && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Email - notification scraping terminé + lien fichier gg sheet <span className="text-orange-500">*</span>
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="email"
                value={formData.emailNotification}
                onChange={(e) => updateField('emailNotification', e.target.value)}
                placeholder="votre@email.com"
                className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                required={!hideEmail}
              />
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-orange-500 dark:text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Configuration Google Sheets</h3>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 transition-all">
            <label className="flex items-center gap-3 cursor-pointer group mb-6">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={formData.nouveauFichier}
                  onChange={(e) => updateField('nouveauFichier', e.target.checked)}
                  className="w-6 h-6 text-orange-600 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 cursor-pointer transition-all"
                />
              </div>
              <span className="text-base font-bold text-gray-800 dark:text-white group-hover:text-orange-500 transition-colors">
                Créer un nouveau fichier Google Sheets
              </span>
            </label>

            <div className="grid grid-cols-1 gap-6">
              {formData.nouveauFichier ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Nom du futur fichier <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nomFichier}
                      onChange={(e) => updateField('nomFichier', e.target.value)}
                      placeholder="ex: Prospects_Immobilier_Lyon"
                      className="w-full px-4 py-3.5 bg-white dark:bg-gray-900 border-2 border-orange-100 dark:border-orange-900/30 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                      required={formData.nouveauFichier}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Nom de la feuille <span className="text-gray-500">(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nomFeuille}
                      onChange={(e) => updateField('nomFeuille', e.target.value)}
                      placeholder="Feuille 1"
                      className="w-full px-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl mb-2">
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                      💡 <strong>Note :</strong> Assurez-vous que le fichier est partagé avec les droits d'édition. Les données seront ajoutées à la suite du fichier existant.
                    </p>
                  </div>
                  {!hideSheetUrl ? (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        URL du fichier Google Sheet existant <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="url"
                        value={formData.urlFichier}
                        onChange={(e) => updateField('urlFichier', e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        className="w-full px-4 py-3.5 bg-white dark:bg-gray-900 border-2 border-blue-100 dark:border-blue-900/30 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                        required={!formData.nouveauFichier && !hideSheetUrl}
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-2xl">
                      <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                        ✅ Fichier Google Sheet configuré par défaut.
                      </p>
                    </div>
                  )}
                  <div className="space-y-2 opacity-60 focus-within:opacity-100 transition-opacity">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Nom de la feuille cible <span className="text-gray-500">(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nomFeuille}
                      onChange={(e) => updateField('nomFeuille', e.target.value)}
                      placeholder="Feuille 1"
                      className="w-full px-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="relative w-full group overflow-hidden rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 transition-transform group-hover:scale-105"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative flex items-center justify-center gap-3 px-8 py-4 text-white font-bold text-lg">
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Scraping en cours...
            </>
          ) : (
            <>
              <Search className="w-6 h-6" />
              Lancer le scraping
            </>
          )}
        </div>
      </button>
    </form>
  );
}
