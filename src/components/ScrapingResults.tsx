import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import { useNotification } from '../contexts/NotificationContext';
import BusinessDetailsModal from './BusinessDetailsModal';
import {
  Filter,
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  MessageSquare,
  Download,
  Search,
  X,
  Eye,
  MessageCircle,
  FileSpreadsheet,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  ChevronDown,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  ArrowLeft,
  Calendar,
  Users
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ScrapingResult {
  id: string;
  session_id: string;
  business_name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  reviews_count?: number;
  category?: string;
  status?: string;
  notes?: string;
  email_status?: 'unverified' | 'valid' | 'risky' | 'invalid' | 'verifying';
  email_last_verified_at?: string;
  last_action_at?: string;
  created_at: string;
}

interface DetailedBusinessData {
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

interface ScrapingResultsProps {
  sessionId: string;
  onClose?: () => void;
}

export default function ScrapingResults({ sessionId, onClose }: ScrapingResultsProps) {
  const { showNotification } = useNotification();
  const [results, setResults] = useState<ScrapingResult[]>([]);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [filteredResults, setFilteredResults] = useState<ScrapingResult[]>([]);
  const [detailedData, setDetailedData] = useState<DetailedBusinessData[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<DetailedBusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('to_contact');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [zoneDetails, setZoneInfo] = useState<{
    lat: number;
    lng: number;
    radius: number;
    city?: string;
  } | null>(null);

  const statusOptions = [
    { value: 'to_contact', label: 'À contacter', icon: MessageCircle, color: 'text-gray-500 bg-gray-100 dark:bg-gray-900/50' },
    { value: 'in_progress', label: 'En cours', icon: Clock, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/50' },
    { value: 'qualified', label: 'Qualifié', icon: UserCheck, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/50' },
    { value: 'converted', label: 'Signé', icon: CheckCircle2, color: 'text-green-500 bg-green-100 dark:bg-green-900/50' },
    { value: 'rejected', label: 'Perdu', icon: XCircle, color: 'text-red-500 bg-red-100 dark:bg-red-900/50' },
  ];

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  useEffect(() => {
    filterResults();
  }, [searchTerm, statusFilter, results]);

  const loadResults = async () => {
    setLoading(true);

    const [resultsResponse, sessionResponse] = await Promise.all([
      supabase
        .from('scraping_results')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false }),
      supabase
        .from('scraping_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle()
    ]);

    let currentResults = resultsResponse.data || [];
    setSessionInfo(sessionResponse.data);

    if (sessionResponse.data?.scraped_data) {
      try {
        let parsedData: DetailedBusinessData[];

        if (typeof sessionResponse.data.scraped_data === 'string') {
          parsedData = JSON.parse(sessionResponse.data.scraped_data);
        } else {
          parsedData = sessionResponse.data.scraped_data as DetailedBusinessData[];
        }

        setDetailedData(parsedData);

        if (parsedData.length > 0) {
          const existingNames = new Set(currentResults.map(r => r.business_name.toLowerCase()));

          const newLeads = parsedData
            .filter(item => {
              const name = (item.Titre || 'Sans nom').toLowerCase();
              return !existingNames.has(name);
            })
            .map(item => ({
              session_id: sessionId,
              business_name: item.Titre || 'Sans nom',
              address: item.Rue && item.Ville ? `${item.Rue}, ${item.Ville}` : item.Rue || item.Ville,
              phone: item.Téléphone?.toString(),
              email: item.Email && item.Email !== 'aucun_mail' ? item.Email : null,
              website: item['Site web'],
              rating: item['Score total'],
              reviews_count: item["Nombre d'avis"],
              category: item['Nom de catégorie'],
              status: 'to_contact'
            }));

          if (newLeads.length > 0) {
            console.log(`Persisting ${newLeads.length} new leads to database...`);
            const { data: insertedLeads, error } = await supabase
              .from('scraping_results')
              .insert(newLeads)
              .select();

            if (error) {
              console.error('Error persisting leads:', error);
              showNotification('error', 'Erreur lors de la sauvegarde des résultats dans la base de données');
            } else if (insertedLeads) {
              currentResults = [...insertedLeads, ...currentResults];
            }
          }
        }
      } catch (e) {
        console.error('Erreur parsing scraped_data:', e);
      }
    }

    setResults(currentResults);
    setLoading(false);
  };

  const handleUpdateLead = async (id: string, updates: Partial<ScrapingResult>) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from('scraping_results')
      .update({
        ...updates,
        last_action_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      showNotification('error', 'Erreur lors de la mise à jour');
    } else {
      setResults(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
      showNotification('success', 'Prospect mis à jour');
    }
    setUpdatingId(null);
  };

  const filterResults = () => {
    let filtered = results;

    // Filter by status if not 'all'
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => (r.status || 'to_contact') === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (result) =>
          result.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredResults(filtered);
  };

  const getZoneFromSession = async () => {
    if (!sessionInfo) return;

    let lat = 0;
    let lng = 0;
    let radius = 0;
    let city = sessionInfo.location || '';

    // 1. Essayer d'extraire du format "Ville (km)"
    const cityMatch = sessionInfo.location?.match(/^(.*) \((.*) km\)$/);
    if (cityMatch) {
      city = cityMatch[1];
      radius = parseFloat(cityMatch[2]) * 1000;
    }

    // 2. Extraire les coordonnées et le rayon de l'URL Google Maps
    // Format type: .../@45.75,4.83,5000m/...
    const urlMatch = sessionInfo.google_maps_url?.match(/@(-?\d+\.\d+),(-?\d+\.\d+),(\d+)m/);
    if (urlMatch) {
      lat = parseFloat(urlMatch[1]);
      lng = parseFloat(urlMatch[2]);
      if (radius === 0) radius = parseFloat(urlMatch[3]);
    } else {
      // Si pas d'URL précise, essayer de parser le champ location si c'est des coordonnées
      const coordMatch = sessionInfo.location?.match(/^(-?\d+\.\d+),(-?\d+\.\d+)$/);
      if (coordMatch) {
        lat = parseFloat(coordMatch[1]);
        lng = parseFloat(coordMatch[2]);
      }
    }

    // 3. Si on a des coordonnées mais pas de nom de ville (vieux scrapings), on fait du reverse geocoding
    if (lat !== 0 && (!city || city.includes(','))) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        city = data.address.city || data.address.town || data.address.village || city;
      } catch (e) {
        console.error('Erreur reverse geocoding:', e);
      }
    }

    setZoneInfo({ lat, lng, radius, city });
    setShowZoneModal(true);
  };

  const getDetailedBusiness = (businessName: string): DetailedBusinessData | null => {
    return detailedData.find(item => item.Titre === businessName) || null;
  };

  const handleExport = (format: 'xlsx' | 'csv') => {
    const data = filteredResults.map((result) => ({
      'Nom': result.business_name,
      'Adresse': result.address || '',
      'Téléphone': result.phone || '',
      'Email': result.email || '',
      'Site Web': result.website || '',
      'Note': result.rating || '',
      'Avis': result.reviews_count || '',
      'Catégorie': result.category || '',
      'Statut': statusOptions.find(o => o.value === result.status)?.label || result.status || 'À contacter',
      'Commentaires': result.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Résultats Scraping');

    const filename = `results-${new Date().toISOString().split('T')[0]}.${format}`;
    // XLSX.writeFile automatically detects format based on extension (csv or xlsx)
    XLSX.writeFile(workbook, filename);

    setShowExportMenu(false);
    showNotification('success', `Fichier ${format.toUpperCase()} généré !`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {selectedBusiness && (
        <BusinessDetailsModal
          business={selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-500 dark:text-gray-400"
                title="Retour à l'historique"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                {sessionInfo?.sector || 'Résultats du Scraping'}
              </h2>
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <button
                  onClick={getZoneFromSession}
                  className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  title="Voir la zone sur la carte"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="font-medium">Voir la zone de recherche</span>
                </button>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{sessionInfo?.created_at ? new Date(sessionInfo.created_at).toLocaleDateString('fr-FR') : '-'}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>{results.length} leads trouvés</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <Download className="w-4 h-4" />
                Exporter
                <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={() => handleExport('xlsx')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      Excel (.xlsx)
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors border-t border-gray-100 dark:border-gray-700"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      CSV (.csv)
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, adresse ou catégorie..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 md:flex-none md:w-64">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none appearance-none"
              >
                <option value="all">Tous les statuts</option>
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredResults.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  {searchTerm
                    ? 'Aucun résultat ne correspond à votre recherche'
                    : results.length > 0
                      ? 'Tous vos prospects ont été déplacés vers la gestion des leads'
                      : 'Aucun résultat n\'a été trouvé lors de ce scraping'}
                </p>
                {results.length > 0 && !searchTerm && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Changez leur statut en "À contacter" pour les faire réapparaître ici.
                  </p>
                )}
              </div>
            ) : (
              filteredResults.map((result) => (
                <div
                  key={result.id}
                  className="p-5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-orange-500 dark:hover:border-orange-400 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex-shrink-0">
                        <Building className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
                          {result.business_name}
                        </h3>
                        {result.category && (
                          <span className="inline-block text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                            {result.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {result.rating && (
                      <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="font-bold text-amber-700 dark:text-amber-400">
                          {result.rating.toFixed(1)}
                        </span>
                        {result.reviews_count !== undefined && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-500">
                            <MessageSquare className="w-3 h-3" />
                            <span>{result.reviews_count}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.address && (
                      <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span className="break-words">{result.address}</span>
                      </div>
                    )}
                    {result.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <a
                          href={`tel:${result.phone}`}
                          className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                        >
                          {result.phone}
                        </a>
                      </div>
                    )}
                    {result.email && (
                      <div className="flex items-center gap-2 group/email min-w-0">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <a
                          href={`mailto:${result.email}`}
                          className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors truncate"
                        >
                          {result.email}
                        </a>

                        {/* Email Status Badge */}
                        {result.email_status === 'valid' ? (
                          <div title="Email vérifié et valide" className="p-0.5 bg-green-100 text-green-600 rounded-full flex-shrink-0">
                            <ShieldCheck className="w-3 h-3" />
                          </div>
                        ) : result.email_status === 'risky' ? (
                          <div title="Email risqué (accept-all)" className="p-0.5 bg-orange-100 text-orange-600 rounded-full flex-shrink-0">
                            <ShieldAlert className="w-3 h-3" />
                          </div>
                        ) : result.email_status === 'invalid' ? (
                          <div title="Email invalide (bounce)" className="p-0.5 bg-red-100 text-red-600 rounded-full flex-shrink-0">
                            <XCircle className="w-3 h-3" />
                          </div>
                        ) : (
                          <button
                            onClick={() => handleUpdateLead(result.id, { email_status: 'verifying' })}
                            className="opacity-0 group-hover/email:opacity-100 transition-opacity p-0.5 bg-gray-100 text-gray-500 hover:text-indigo-600 rounded-full flex-shrink-0"
                            title="Vérifier cet email"
                          >
                            <ShieldQuestion className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                    {result.website && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Globe className="w-4 h-4 flex-shrink-0" />
                        <a
                          href={result.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors truncate"
                        >
                          {result.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap items-center gap-2">
                      {statusOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = (result.status || 'to_contact') === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleUpdateLead(result.id, { status: option.value })}
                            disabled={updatingId === result.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isSelected
                              ? `${option.color} ring-2 ring-current ring-offset-2 dark:ring-offset-gray-800`
                              : 'bg-gray-50 dark:bg-gray-900/50 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="relative group">
                      <MessageCircle className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-focus-within:text-orange-500" />
                      <textarea
                        value={result.notes || ''}
                        onChange={(e) => setResults(prev => prev.map(item => item.id === result.id ? { ...item, notes: e.target.value } : item))}
                        onBlur={(e) => handleUpdateLead(result.id, { notes: e.target.value })}
                        placeholder="Ajouter une note interne sur ce prospect..."
                        rows={1}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {detailedData.length > 0 && getDetailedBusiness(result.business_name) && (
                        <button
                          onClick={() => setSelectedBusiness(getDetailedBusiness(result.business_name))}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Détails
                        </button>
                      )}
                    </div>

                    {result.last_action_at && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">
                        Mis à jour le {new Date(result.last_action_at).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showZoneModal && zoneDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">Zone de Prospection</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {zoneDetails.city || 'Localisation'} • {(zoneDetails.radius / 1000).toFixed(1)} km de rayon
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowZoneModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="h-96 w-full relative">
              <MapContainer
                center={[zoneDetails.lat, zoneDetails.lng]}
                zoom={12}
                style={{ width: '100%', height: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Circle
                  center={[zoneDetails.lat, zoneDetails.lng]}
                  radius={zoneDetails.radius}
                  pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.2,
                    weight: 2
                  }}
                />
              </MapContainer>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
              <button
                onClick={() => setShowZoneModal(false)}
                className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
