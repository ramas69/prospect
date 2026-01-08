import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useSearchParams } from 'react-router-dom';
import { supabase, ScrapingSession } from '../lib/supabase';
import ScrapingResults from '../components/ScrapingResults';
import {
  Search,
  Filter,
  ExternalLink,
  Download,
  Calendar,
  MapPin,
  Users,
  User,
  Mail,
  Clock,
  Eye,
  Trash2,
  ChevronDown,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { useModal } from '../contexts/ModalContext';
import * as XLSX from 'xlsx';

export default function History() {
  const { profile } = useAuth();
  const { showNotification } = useNotification();
  const { showConfirm } = useModal();
  const [sessions, setSessions] = useState<ScrapingSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ScrapingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSessionId = searchParams.get('session_id');

  const location = useLocation();

  useEffect(() => {
    loadSessions();
  }, [profile]);

  useEffect(() => {
    // If state is passed (e.g. from NewScraping redirect), sync it to URL
    if (location.state?.sessionId) {
      setSearchParams({ session_id: location.state.sessionId });
    }
  }, [location.state, setSearchParams]);

  useEffect(() => {
    filterSessions();
  }, [searchTerm, statusFilter, sessions]);

  // ... (rest of functions remain similar until render)

  const loadSessions = async () => {
    if (!profile) return;

    // 1. Charger les sessions
    const { data: sessionsData } = await supabase
      .from('scraping_sessions')
      .select('*')
      // .eq('user_id', profile.id) // Removed to allow seeing all users' sessions
      .order('created_at', { ascending: false });

    if (!sessionsData) {
      setSessions([]);
      setLoading(false);
      return;
    }

    // 2. Charger les stats des prospects par session (tous les statuts)
    const { data: allResults } = await supabase
      .from('scraping_results')
      .select('session_id, status')
      .in('session_id', sessionsData.map(s => s.id));

    // Créer un dictionnaire des comptes
    const statsMap: Record<string, { total: number; to_contact: number }> = {};

    allResults?.forEach(r => {
      if (!statsMap[r.session_id]) {
        statsMap[r.session_id] = { total: 0, to_contact: 0 };
      }
      statsMap[r.session_id].total++;
      if (r.status === 'to_contact') {
        statsMap[r.session_id].to_contact++;
      }
    });

    // 3. Marquer les sessions comme "traitées"
    const sessionsWithStatus = sessionsData.map(session => {
      const stats = statsMap[session.id] || { total: 0, to_contact: 0 };
      const toContactCount = stats.to_contact;

      // Logique "Traité" :
      // 1. Si on a des données en base (total > 0), c'est traité si contactCount == 0
      // 2. Si PAS de données en base (total == 0) mais qu'il y en avait dans le JSON (actual_results > 0), 
      //    alors ce n'est PAS traité (c'est une vieille session non migrée)
      // 3. Sinon (total == 0 et actual == 0), c'est traité (session vide)

      let isProcessed = false;

      if (stats.total > 0) {
        // Cas standard : données migrées -> traité si plus rien à contacter
        isProcessed = toContactCount === 0;
      } else {
        // Cas legacy : pas de données en base
        if ((session.actual_results || 0) > 0) {
          // Il y a des résultats non migrés -> NON traité
          isProcessed = false;
        } else {
          // Session vide -> traité
          isProcessed = true;
        }
      }

      return {
        ...session,
        isProcessed,
        toContactCount
      };
    });

    setSessions(sessionsWithStatus);
    setLoading(false);
  };

  const filterSessions = () => {
    let filtered = [...sessions];

    if (searchTerm) {
      filtered = filtered.filter(
        (session) =>
          session.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((session) => session.status === statusFilter);
    }

    setFilteredSessions(filtered);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSessions.map(s => s.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    showConfirm(
      'Supprimer la sélection',
      `Êtes-vous sûr de vouloir supprimer les ${selectedIds.size} scrapings sélectionnés ? Cette action est irréversible.`,
      async () => {
        setIsDeletingBulk(true);
        try {
          const { data, error } = await supabase
            .from('scraping_sessions')
            .delete()
            .in('id', Array.from(selectedIds))
            .select(); // On demande le retour des données pour vérifier si ça a marché

          if (error) throw error;

          if (!data || data.length === 0) {
            throw new Error("La base de données a refusé la suppression. Vérifiez vos droits RLS.");
          }

          showNotification('success', `${data.length} scrapings supprimés avec succès`);
          const deletedIds = new Set(data.map(s => s.id));
          setSessions(prev => prev.filter(s => !deletedIds.has(s.id)));
          setSelectedIds(new Set());
        } catch (error: any) {
          showNotification('error', `Erreur lors de la suppression : ${error.message}`);
        } finally {
          setIsDeletingBulk(false);
        }
      },
      'danger',
      'Supprimer tout'
    );
  };

  const handleDeleteSessionById = async (id: string) => {
    setDeletingId(id);
    try {
      const { data, error } = await supabase
        .from('scraping_sessions')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("La base de données a refusé la suppression. Vérifiez vos droits RLS.");
      }

      showNotification('success', 'Scraping supprimé avec succès');
      setSessions(prev => prev.filter(s => s.id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error: any) {
      showNotification('error', `Erreur lors de la suppression : ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (id: string) => {
    showConfirm(
      'Supprimer le scraping',
      'Êtes-vous sûr de vouloir supprimer ce scraping ? Cette action est irréversible et supprimera tous les prospects associés.',
      () => {
        handleDeleteSessionById(id);
      },
      'danger',
      'Supprimer définitivement'
    );
  };



  const handleExport = async (format: 'xlsx' | 'csv', targetIds?: string[]) => {
    setShowExportMenu(false);

    const sessionIdsToExport = targetIds
      ? targetIds
      : (selectedIds.size > 0 ? Array.from(selectedIds) : filteredSessions.map(s => s.id));

    if (sessionIdsToExport.length === 0) {
      showNotification('error', 'Aucun scraping sélectionné pour l\'export');
      return;
    }

    showNotification('info', `Préparation de l'export ${format.toUpperCase()}...`);

    // Récupérer tous les résultats pour les sessions sélectionnées
    const { data: results, error } = await supabase
      .from('scraping_results')
      .select('*')
      .in('session_id', sessionIdsToExport);

    if (error) {
      showNotification('error', 'Erreur lors de la récupération des données : ' + error.message);
      return;
    }

    if (!results || results.length === 0) {
      showNotification('error', 'Aucun prospect trouvé dans les scrapings sélectionnés');
      return;
    }

    const exportData = results.map((result) => ({
      'Nom de l\'entreprise': result.business_name,
      'Adresse': result.address || '',
      'Téléphone': result.phone || '',
      'Email': result.email || '',
      'Site Web': result.website || '',
      'Note': result.rating || '',
      'Nombre d\'avis': result.reviews_count || '',
      'Catégorie': result.category || '',
      'Statut': getStatusText(result.status || 'to_contact'),
      'Date du Scraping': new Date(result.created_at).toLocaleDateString('fr-FR'),
    }));

    // Créer le classeur Excel
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Prospects');

    // Déclencher le téléchargement
    const extension = format === 'csv' ? 'csv' : 'xlsx';
    XLSX.writeFile(workbook, `export-prospects-${new Date().toISOString().split('T')[0]}.${extension}`);

    showNotification('success', `${results.length} prospects exportés en ${format.toUpperCase()} !`);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getStatusText = (status: string) => {
    const texts = {
      completed: 'Terminé',
      in_progress: 'En cours',
      pending: 'En attente',
      failed: 'Échoué',
    };
    return texts[status as keyof typeof texts] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (selectedSessionId) {
    return (
      <ScrapingResults
        sessionId={selectedSessionId}
        onClose={() => setSearchParams({})}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Historique des Scraping
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {sessions.length} scraping au total
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeletingBulk}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl font-semibold hover:bg-red-200 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer ({selectedIds.size})
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={selectedIds.size === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${selectedIds.size > 0
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
            >
              <Download className="w-4 h-4" />
              {selectedIds.size > 0 ? `Exporter la sélection (${selectedIds.size})` : 'Sélectionnez pour exporter'}
              <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20">
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
            )}

            {/* Backdrop to close menu */}
            {showExportMenu && (
              <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par secteur ou location..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none appearance-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="completed">Terminé</option>
                <option value="in_progress">En cours</option>
                <option value="pending">En attente</option>
                <option value="failed">Échoué</option>
              </select>
            </div>
          </div>

          <button
            onClick={toggleSelectAll}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm whitespace-nowrap"
          >
            {selectedIds.size === filteredSessions.length && filteredSessions.length > 0 ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        </div>

        <div className="space-y-3">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Aucun résultat trouvé</p>
            </div>
          ) : (
            filteredSessions.map((session: any) => (
              <div
                key={session.id}
                className={`p-5 border transition-all rounded-xl relative group flex items-start gap-4 ${session.isProcessed
                  ? 'bg-gray-100/50 border-gray-200 dark:bg-gray-800/20 dark:border-gray-700 opacity-50 grayscale'
                  : selectedIds.has(session.id)
                    ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800'
                    : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-400 hover:shadow-md'
                  }`}
              >
                <div className="pt-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(session.id)}
                    onChange={() => toggleSelect(session.id)}
                    className="w-5 h-5 text-orange-600 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 cursor-pointer transition-all"
                  />
                </div>

                <div className="flex-1 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0" onClick={() => setSearchParams({ session_id: session.id })} style={{ cursor: 'pointer' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className={`text-lg font-bold transition-colors ${session.isProcessed ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-white'}`}>
                        {session.sector}
                      </h3>
                      {session.isProcessed ? (
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded font-bold uppercase tracking-wider">
                          Traité
                        </span>
                      ) : (
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusBadge(
                            session.status
                          )}`}
                        >
                          {getStatusText(session.status)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      {session.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{session.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{session.actual_results} leads</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <User className="w-4 h-4" />
                        <span>{profile?.full_name?.split(' ')[0] || 'Utilisateur'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4" />
                        <span>{session.emails_found} emails</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(session.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    {session.duration_seconds && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>Durée: {Math.floor(session.duration_seconds / 60)} min</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSearchParams({ session_id: session.id }); }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Voir
                    </button>
                    {session.sheet_url && (
                      <a
                        href={session.sheet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors font-medium text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Sheet
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); confirmDelete(session.id); }}
                      disabled={deletingId === session.id}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      {deletingId === session.id ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
