import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNotification } from '../contexts/NotificationContext';
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  Download,
  Search,
  MessageCircle,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  Filter,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Eye
} from 'lucide-react';
import BusinessDetailsModal from '../components/BusinessDetailsModal';
import * as XLSX from 'xlsx';

interface Prospect {
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
  sessions?: {
    sector: string;
    location: string | null;
  };
  raw_data?: any;
}

export default function Prospects() {
  const { showNotification } = useNotification();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [filteredProspects, setFilteredProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contactFilter, setContactFilter] = useState('all');
  const [updatingAction, setUpdatingAction] = useState<{ id: string, type: 'status' | 'note' | 'email', value?: string } | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [selectedProspectId, setSelectedProspectId] = useState<string | undefined>(undefined);
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

  const statusOptions = [
    { value: 'to_contact', label: 'À contacter', icon: MessageCircle, color: 'text-gray-500 bg-gray-100 dark:bg-gray-900/50' },
    { value: 'in_progress', label: 'En cours', icon: Clock, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/50' },
    { value: 'qualified', label: 'Qualifié', icon: UserCheck, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/50' },
    { value: 'converted', label: 'Signé', icon: CheckCircle2, color: 'text-green-500 bg-green-100 dark:bg-green-900/30' },
    { value: 'rejected', label: 'Perdu', icon: XCircle, color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
  ];

  useEffect(() => {
    loadProspects();
  }, []);

  useEffect(() => {
    filterProspects();
  }, [searchTerm, statusFilter, contactFilter, prospects]);

  const loadProspects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('scraping_results')
      .select(`
  *,
  raw_data,
  sessions: scraping_sessions(
    sector,
    location
  )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      showNotification('error', 'Erreur lors du chargement des prospects');
    } else {
      setProspects(data || []);
    }
    setLoading(false);
  };

  const filterProspects = () => {
    // On garde tous les leads par default
    let filtered = prospects;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter === 'all') {
      filtered = filtered.filter(p => (p.status || 'to_contact') !== 'to_contact');
    } else {
      filtered = filtered.filter(p => (p.status || 'to_contact') === statusFilter);
    }

    switch (contactFilter) {
      case 'email':
        filtered = filtered.filter(p => p.email && p.email !== '');
        break;
      case 'website':
        filtered = filtered.filter(p => p.website && p.website !== '');
        break;
      case 'email_and_website':
        filtered = filtered.filter(p => (p.email && p.email !== '') && (p.website && p.website !== ''));
        break;
    }

    setFilteredProspects(filtered);
  };

  const handleUpdateProspect = async (id: string, updates: Partial<Prospect>) => {
    let type: 'status' | 'note' | 'email' = 'status';
    let value = updates.status;

    if (updates.notes !== undefined) {
      type = 'note';
      value = undefined;
    } else if (updates.email_status) {
      type = 'email';
      value = updates.email_status;
    }

    setUpdatingAction({ id, type, value });

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
      setProspects(prev => prev.map(item => item.id === id ? { ...item, ...updates, last_action_at: new Date().toISOString() } : item));
      showNotification('success', 'Prospect mis à jour');
    }
    setUpdatingAction(null);
  };

  const exportToExcel = (format: 'standard' | 'hubspot' | 'pipedrive' = 'standard') => {
    let data: any[] = [];
    let filename = `prospects - ${format} - ${new Date().toISOString().split('T')[0]}.xlsx`;

    if (format === 'hubspot') {
      data = filteredProspects.map(p => ({
        'Email': p.email || '',
        'Company Name': p.business_name,
        'Phone Number': p.phone || '',
        'Website URL': p.website || '',
        'City': p.sessions?.location || '',
        'Industry': p.category || p.sessions?.sector || '',
        'Address': p.address || '',
        'Notes': p.notes || ''
      }));
    } else if (format === 'pipedrive') {
      data = filteredProspects.map(p => ({
        'Organization Name': p.business_name,
        'Email': p.email || '',
        'Phone': p.phone || '',
        'Website': p.website || '',
        'Organization Address': p.address || '',
        'Industry': p.category || p.sessions?.sector || '',
        'Visible to': 'Entire company'
      }));
    } else {
      data = filteredProspects.map(p => ({
        'Nom': p.business_name,
        'Secteur': p.sessions?.sector || '',
        'Ville': p.sessions?.location || '',
        'Email': p.email || '',
        'Téléphone': p.phone || '',
        'Site Web': p.website || '',
        'Statut': statusOptions.find(o => o.value === p.status)?.label || 'À contacter',
        'Commentaires': p.notes || ''
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Prospects');
    XLSX.writeFile(workbook, filename);

    setShowExportMenu(false);
    showNotification('success', 'Fichier Excel généré !');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedBusiness && (
        <BusinessDetailsModal
          business={selectedBusiness}
          prospectId={selectedProspectId}
          onClose={() => {
            setSelectedBusiness(null);
            setSelectedProspectId(undefined);
          }}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Gestion des Prospects</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredProspects.length} prospect{filteredProspects.length > 1 ? 's' : ''} au total
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            <Download className="w-5 h-5" />
            Exporter
            <ChevronDown className={`w - 4 h - 4 transition - transform ${showExportMenu ? 'rotate-180' : ''} `} />
          </button>

          {showExportMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => exportToExcel('standard')}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 transition-colors"
                >
                  Format Excel (.xlsx)
                </button>
                <div className="h-[1px] bg-gray-100 dark:bg-gray-700 my-1 mx-2" />
                <button
                  onClick={() => exportToExcel('hubspot')}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 transition-colors flex items-center justify-between"
                >
                  HubSpot CRM
                  <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded uppercase font-black">Pro</span>
                </button>
                <button
                  onClick={() => exportToExcel('pipedrive')}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 transition-colors flex items-center justify-between"
                >
                  Pipedrive CRM
                  <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded uppercase font-black">Pro</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un prospect..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none"
            >
              <option value="all">Tous les statuts</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={contactFilter}
              onChange={(e) => setContactFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none"
            >
              <option value="all">Tous les contacts</option>
              <option value="email">Email</option>
              <option value="website">Site web</option>
              <option value="email_and_website">Email + Site web</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredProspects.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
              <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Aucun prospect ne correspond à votre recherche</p>
            </div>
          ) : (
            filteredProspects.map((prospect) => (
              <div
                key={prospect.id}
                className="p-6 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl hover:border-orange-500 dark:hover:border-orange-400 transition-all group"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white truncate">
                        {prospect.business_name}
                      </h3>
                      {!prospect.website && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider rounded">
                          <AlertCircle className="w-3 h-3" />
                          Pas de site web
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-orange-500" />
                        <span>{prospect.sessions?.sector}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        <span className="truncate max-w-[200px]">{prospect.address || prospect.sessions?.location || 'Lieu inconnu'}</span>
                      </div>
                      {prospect.email && (
                        <div className="flex items-center gap-1.5 group/email">
                          <Mail className="w-4 h-4 text-green-500" />
                          <a href={`mailto:${prospect.email} `} className="hover:text-orange-500">{prospect.email}</a>

                          {/* Email Status Badge */}
                          {prospect.email_status === 'valid' ? (
                            <div title="Email vérifié et valide" className="p-0.5 bg-green-100 text-green-600 rounded-full">
                              <ShieldCheck className="w-3 h-3" />
                            </div>
                          ) : prospect.email_status === 'risky' ? (
                            <div title="Email risqué (accept-all)" className="p-0.5 bg-orange-100 text-orange-600 rounded-full">
                              <ShieldAlert className="w-3 h-3" />
                            </div>
                          ) : prospect.email_status === 'invalid' ? (
                            <div title="Email invalide (bounce)" className="p-0.5 bg-red-100 text-red-600 rounded-full">
                              <XCircle className="w-3 h-3" />
                            </div>
                          ) : (
                            <button
                              onClick={() => handleUpdateProspect(prospect.id, { email_status: 'verifying' })}
                              className="opacity-0 group-hover/email:opacity-100 transition-opacity p-0.5 bg-gray-100 text-gray-500 hover:text-indigo-600 rounded-full"
                              title="Vérifier cet email"
                            >
                              <ShieldQuestion className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                      {prospect.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-blue-500" />
                          <a href={`tel:${prospect.phone} `} className="hover:text-orange-500">{prospect.phone}</a>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {statusOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = (prospect.status || 'to_contact') === option.value;
                        const isUpdating = updatingAction?.id === prospect.id &&
                          updatingAction?.type === 'status' &&
                          updatingAction?.value === option.value;

                        return (
                          <button
                            key={option.value}
                            onClick={() => handleUpdateProspect(prospect.id, { status: option.value })}
                            disabled={updatingAction !== null}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isSelected
                              ? `${option.color} ring-2 ring-current ring-offset-2 dark:ring-offset-gray-800`
                              : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-100 disabled:opacity-50'
                              }`}
                          >
                            {isUpdating ? (
                              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Icon className="w-3.5 h-3.5" />
                            )}
                            {option.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <textarea
                        value={prospect.notes || ''}
                        onChange={(e) => setProspects(prev => prev.map(item => item.id === prospect.id ? { ...item, notes: e.target.value } : item))}
                        onBlur={(e) => handleUpdateProspect(prospect.id, { notes: e.target.value })}
                        placeholder="Notes de prospection..."
                        rows={1}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col items-center gap-2">
                    {prospect.website && (
                      <a
                        href={prospect.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 lg:w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-all text-sm font-bold"
                      >
                        <Globe className="w-4 h-4" />
                        Site Web
                      </a>
                    )}
                    <button
                      onClick={async () => {
                        setSelectedProspectId(prospect.id);
                        // 1. Si on a déjà les raw_data, on les utilise directement
                        if (prospect.raw_data) {
                          setSelectedBusiness(prospect.raw_data);
                          return;
                        }

                        // 2. Sinon, on va chercher dans la session d'origine (pour les vieux leads)
                        try {
                          setLoadingDetails(prospect.id);

                          const { data: sessionData, error } = await supabase
                            .from('scraping_sessions')
                            .select('scraped_data')
                            .eq('id', prospect.session_id)
                            .single();

                          if (error) throw error;

                          if (sessionData && sessionData.scraped_data) {
                            let parsedData: any[] = [];
                            if (typeof sessionData.scraped_data === 'string') {
                              parsedData = JSON.parse(sessionData.scraped_data);
                            } else {
                              parsedData = sessionData.scraped_data;
                            }

                            // Trouver le business correspondant
                            const details = parsedData.find((item: any) => item.Titre === prospect.business_name);

                            if (details) {
                              setSelectedBusiness(details);
                            } else {
                              // Fallback si non trouvé dans le JSON
                              throw new Error("Détails non trouvés dans la session");
                            }
                          }
                        } catch (err) {
                          console.error('Erreur chargement détails:', err);
                          // Fallback manuel basique
                          setSelectedBusiness({
                            Titre: prospect.business_name,
                            Rue: prospect.address,
                            Ville: prospect.sessions?.location,
                            Téléphone: prospect.phone,
                            Email: prospect.email,
                            "Site web": prospect.website,
                            "Score total": prospect.rating,
                            "Nombre d'avis": prospect.reviews_count,
                            "Nom de catégorie": prospect.category || prospect.sessions?.sector,
                          });
                        } finally {
                          setLoadingDetails(null);
                        }
                      }}
                      disabled={loadingDetails === prospect.id}
                      className="flex-1 lg:w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-all text-sm font-bold disabled:opacity-70 disabled:cursor-wait"
                    >
                      {loadingDetails === prospect.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      Voir détails
                    </button>
                    <button className="flex-1 lg:w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl hover:bg-orange-100 transition-all text-sm font-bold">
                      <ExternalLink className="w-4 h-4" />
                      Ouvrir Maps
                    </button>
                  </div>
                </div>

                {prospect.last_action_at && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Dernier contact : {new Date(prospect.last_action_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

