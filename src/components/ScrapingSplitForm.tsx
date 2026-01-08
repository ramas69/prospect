import { useState, useEffect } from 'react';
import {
    Search, Link as LinkIcon, Mail, FileSpreadsheet, MapPin, Target,
    Utensils, Home, Briefcase, Wrench, Stethoscope, GraduationCap, Car, ShoppingBag,
    Smartphone, Coffee, Music, Camera, Zap
} from 'lucide-react';
import MapPreview from './MapPreview';
import RadarScanningOverlay from './RadarScanningOverlay';
import ScrapingProgress from './ScrapingProgress';
import { useModal } from '../contexts/ModalContext';
import { Template } from '../lib/supabase';

// Helper to get icon based on sector/name
const getTemplateIcon = (sector: string, name: string) => {
    const text = (sector + ' ' + name).toLowerCase();

    if (text.includes('resto') || text.includes('manger') || text.includes('pizza') || text.includes('burger') || text.includes('restaurant')) return Utensils;
    if (text.includes('immo') || text.includes('maison') || text.includes('appart')) return Home;
    if (text.includes('sante') || text.includes('medecin') || text.includes('docteur') || text.includes('dentiste')) return Stethoscope;
    if (text.includes('ecole') || text.includes('formation') || text.includes('cours')) return GraduationCap;
    if (text.includes('auto') || text.includes('garage') || text.includes('parking')) return Car;
    if (text.includes('tech') || text.includes('web') || text.includes('info')) return Smartphone;
    if (text.includes('cafe') || text.includes('bar')) return Coffee;
    if (text.includes('art') || text.includes('musique') || text.includes('event')) return Music;
    if (text.includes('photo') || text.includes('video')) return Camera;
    if (text.includes('elec') || text.includes('plombier') || text.includes('btp')) return Wrench;
    if (text.includes('commerce') || text.includes('boutique') || text.includes('magasin')) return ShoppingBag;

    return Briefcase; // Default
};

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

interface ScrapingSplitFormProps {
    templates: Template[];
    onTemplateSelect: (t: Template) => void;
    onSubmit: (data: ProspectionFormData) => void;
    isLoading: boolean;
    initialData?: Partial<ProspectionFormData>;
    hideEmail?: boolean;
    hideSheetUrl?: boolean;
    sessionId?: string | null;
    onScrapingComplete?: () => void;
}

export default function ScrapingSplitForm({
    templates,
    onTemplateSelect,
    onSubmit,
    isLoading,
    initialData,
    hideEmail = false,
    hideSheetUrl = false,
    sessionId,
    onScrapingComplete = () => { }
}: ScrapingSplitFormProps) {
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

            if (data.cityName) {
                const radiusKm = (data.radius / 1000).toFixed(1);
                updateField('location', `${data.cityName} (${radiusKm} km)`);
            }
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] -m-6 overflow-hidden bg-white dark:bg-gray-900">
            {/* LEFT PANEL - SCROLLABLE CONFIGURATION */}

            <div className="w-full lg:w-5/12 xl:w-1/3 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 shadow-xl h-[calc(100vh-80px)]">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {sessionId && isLoading ? (
                        <div className="p-6">
                            <ScrapingProgress
                                sessionId={sessionId}
                                onComplete={onScrapingComplete}
                                minimal
                            />
                        </div>
                    ) : (
                        <div className="p-6 space-y-8">

                            {/* Header */}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Nouveau Scraping</h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Configurez votre campagne de prospection en quelques clics.
                                </p>
                            </div>

                            {/* Templates Section */}
                            {templates.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
                                        Accès rapide
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3">
                                        {templates.map((template) => {
                                            const Icon = getTemplateIcon(template.sector, template.name);

                                            // Improved Heuristic:
                                            // Sector = Title (e.g. Restaurants)
                                            // Subtitle = Location (from field OR extracted from name)
                                            const title = template.sector;

                                            // Priority: Explicit location > Extracted from name > Default
                                            let subtitle = template.location;
                                            if (!subtitle) {
                                                subtitle = template.name.replace(new RegExp(template.sector, 'i'), '').trim() || 'France';
                                            }

                                            return (
                                                <button
                                                    key={template.id}
                                                    onClick={() => onTemplateSelect(template)}
                                                    className="group relative flex flex-col items-start p-3 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-solid hover:border-orange-500 dark:hover:border-orange-500 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                                                    type="button"
                                                >
                                                    <div className="flex items-start justify-between w-full mb-2">
                                                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40 transition-colors">
                                                            <Icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                                        </div>
                                                    </div>

                                                    <div className="text-left w-full space-y-0.5">
                                                        <span className="block font-bold text-gray-800 dark:text-white text-sm capitalize">
                                                            {title}
                                                        </span>
                                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                            <MapPin className="w-3 h-3" />
                                                            <span className="truncate">{subtitle}</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <form id="scraping-form" onSubmit={handleSubmit} className="space-y-6">

                                {/* Main Inputs */}
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Secteur d'activité <span className="text-orange-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={formData.secteurActivite}
                                                onChange={(e) => updateField('secteurActivite', e.target.value)}
                                                placeholder="ex: Coiffeur, Agence Web..."
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Lieu / Zone cible
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={formData.location || ''}
                                                readOnly // Readonly because it's populated by the map or template
                                                placeholder="Sélectionnez une zone sur la carte ->"
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 cursor-default outline-none"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                            <Target className="w-3 h-3" />
                                            Utilisez la carte à droite pour définir la zone
                                        </p>
                                    </div>

                                    <div className="space-y-2 hidden">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Lien Google Maps <span className="text-orange-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="url"
                                                value={formData.lienGoogleMaps}
                                                onChange={(e) => updateField('lienGoogleMaps', e.target.value)}
                                                placeholder="https://www.google.com/maps/search/..."
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none"
                                                required
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            L'URL est remplie automatiquement si vous utilisez la carte.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Limite de résultats
                                        </label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="500"
                                            value={formData.limitResultats}
                                            onChange={(e) => updateField('limitResultats', Number(e.target.value))}
                                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>1</span>
                                            <span className="font-bold text-orange-600">{formData.limitResultats} prospects</span>
                                            <span>500</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Email & Notifications */}
                                {!hideEmail && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Email de notification
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="email"
                                                value={formData.emailNotification}
                                                onChange={(e) => updateField('emailNotification', e.target.value)}
                                                placeholder="votre@email.com"
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Google Sheets Config */}
                                {!hideSheetUrl && (
                                    <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-2 mb-4">
                                            <FileSpreadsheet className="w-5 h-5 text-green-600" />
                                            <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Export Google Sheets</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="newFile"
                                                    checked={formData.nouveauFichier}
                                                    onChange={(e) => updateField('nouveauFichier', e.target.checked)}
                                                    className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                                />
                                                <label htmlFor="newFile" className="text-sm text-gray-700 dark:text-gray-300">
                                                    Créer un nouveau fichier
                                                </label>
                                            </div>

                                            {formData.nouveauFichier ? (
                                                <div className="animate-in fade-in slide-in-from-top-2">
                                                    <input
                                                        type="text"
                                                        value={formData.nomFichier}
                                                        onChange={(e) => updateField('nomFichier', e.target.value)}
                                                        placeholder="Nom du fichier (ex: Prospects Lyon)"
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                    <div className="relative">
                                                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="url"
                                                            value={formData.urlFichier}
                                                            onChange={(e) => updateField('urlFichier', e.target.value)}
                                                            placeholder="URL du Google Sheet existant"
                                                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                                        />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={formData.nomFeuille}
                                                        onChange={(e) => updateField('nomFeuille', e.target.value)}
                                                        placeholder="Nom de l'onglet (optionnel)"
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Lancement...
                                        </span>
                                    ) : (
                                        'Lancer le scraping'
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL - IMMERSIVE MAP */}
            <div className="w-full lg:w-7/12 xl:w-2/3 h-[400px] lg:h-full relative bg-gray-100 dark:bg-gray-800">
                {isLoading && sessionId && <RadarScanningOverlay sessionId={sessionId} />}
                <MapPreview
                    onZoneSelect={handleZoneSelect}
                    locationQuery={formData.location}
                    searchTerm={formData.secteurActivite}
                    initialCenter={{ lat: 45.764043, lng: 4.835659 }} // Lyon center
                />
            </div>
        </div>
    );
}
