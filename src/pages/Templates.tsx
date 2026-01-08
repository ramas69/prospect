import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { supabase, Template } from '../lib/supabase';
import { BookmarkPlus, Star, Trash2, Edit, Plus, X } from 'lucide-react';
import { useModal } from '../contexts/ModalContext';

export default function Templates() {
  const { profile } = useAuth();
  const { showNotification } = useNotification();
  const { showConfirm } = useModal();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sector: '',
    location: '',
    limit_results: 10,
  });

  useEffect(() => {
    loadTemplates();
  }, [profile]);

  const loadTemplates = async () => {
    if (!profile) return;

    const { data: templatesData } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (!templatesData) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    // Sync usage counts with actual history
    const updatedTemplates = await Promise.all(
      templatesData.map(async (template) => {
        // Count matching sessions
        let query = supabase
          .from('scraping_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('sector', template.sector);

        if (template.location) {
          query = query.ilike('location', `%${template.location}%`);
        }

        const { count } = await query;
        const actualCount = count || 0;

        // Update if different
        if (actualCount !== template.use_count) {
          await supabase
            .from('templates')
            .update({ use_count: actualCount })
            .eq('id', template.id);

          return { ...template, use_count: actualCount };
        }

        return template;
      })
    );

    setTemplates(updatedTemplates);
    setLoading(false);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    let error;

    if (editingTemplate) {
      const { error: updateError } = await supabase
        .from('templates')
        .update({
          ...formData,
        })
        .eq('id', editingTemplate.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('templates').insert({
        user_id: profile.id,
        ...formData,
      });
      error = insertError;
    }

    if (error) {
      showNotification('error', `Erreur lors de la ${editingTemplate ? 'modification' : 'création'} du template`);
      return;
    }

    showNotification('success', `Template ${editingTemplate ? 'modifié' : 'créé'} avec succès !`);
    handleCloseModal();
    loadTemplates();
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      sector: template.sector,
      location: template.location || '',
      limit_results: template.limit_results,
    });
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingTemplate(null);
    setFormData({ name: '', sector: '', location: '', limit_results: 10 });
  };

  const toggleFavorite = async (template: Template) => {
    const { error } = await supabase
      .from('templates')
      .update({ is_favorite: !template.is_favorite })
      .eq('id', template.id);

    if (error) {
      showNotification('error', 'Erreur lors de la mise à jour');
      return;
    }

    showNotification(
      'success',
      template.is_favorite ? 'Retiré des favoris' : 'Ajouté aux favoris'
    );
    loadTemplates();
  };

  const deleteTemplate = async (id: string) => {
    showConfirm(
      'Supprimer le template',
      'Êtes-vous sûr de vouloir supprimer ce template ?',
      async () => {
        const { error } = await supabase.from('templates').delete().eq('id', id);

        if (error) {
          showNotification('error', 'Erreur lors de la suppression');
          return;
        }

        showNotification('success', 'Template supprimé');
        loadTemplates();
      },
      'danger',
      'Supprimer'
    );
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Mes Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {templates.length} template{templates.length > 1 ? 's' : ''} sauvegardé{templates.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}

          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"

        >
          <Plus className="w-5 h-5" />
          Nouveau Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
          <BookmarkPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            Aucun template
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Créez votre premier template pour gagner du temps
          </p>
          <button
            onClick={() => setShowCreateModal(true)}

            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"

          >
            Créer un template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-lg transition-all relative group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{template.sector}</p>
                </div>
                <button
                  onClick={() => toggleFavorite(template)}
                  className={`p-2 rounded-lg transition-colors ${template.is_favorite
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-yellow-500'
                    }`}
                >
                  <Star className={`w-5 h-5 ${template.is_favorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              {template.location && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                  📍 {template.location}
                </p>
              )}

              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Limite: {template.limit_results}</span>
                <span>•</span>
                <span>Utilisé {template.use_count} fois</span>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(template)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors text-sm font-medium"
                >
                  <Edit className="w-4 h-4" />

                  Modifier
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {editingTemplate ? 'Modifier le Template' : 'Nouveau Template'}
              </h2>
              <button
                onClick={handleCloseModal}

                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"

              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nom du template
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Restaurants Paris"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Secteur d'activité
                </label>
                <input
                  type="text"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  placeholder="ex: Restaurant"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="ex: Paris, France"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Limite de résultats
                </label>
                <input
                  type="number"
                  value={formData.limit_results}
                  onChange={(e) =>
                    setFormData({ ...formData, limit_results: Number(e.target.value) })
                  }
                  min={1}
                  max={500}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                {editingTemplate ? 'Modifier le template' : 'Créer le template'}
              </button>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
