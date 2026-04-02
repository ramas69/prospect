import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useModal } from '../contexts/ModalContext';
import { supabase, UserSettings } from '../lib/supabase';
import {
  User,
  Save,
  Shield,
  Database,
  Settings as SettingsIcon,
  Lock,
  KeyRound,
  Plug,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export default function Settings() {
  const { profile, settings, refreshProfile, refreshSettings } = useAuth();
  const { showNotification } = useNotification();
  const { showConfirm, showAlert } = useModal();

  // Tabs State
  const [activeTab, setActiveTab] = useState<'profile' | 'config' | 'integrations'>('profile');

  // Profile Form State
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
  });

  // Password Form State
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });

  // Integration keys
  const [brevoKey, setBrevoKey] = useState(settings?.brevo_api_key || '');
  const [lemlistKey, setLemlistKey] = useState(settings?.lemlist_api_key || '');
  const [showBrevoKey, setShowBrevoKey] = useState(false);
  const [showLemlistKey, setShowLemlistKey] = useState(false);
  const [testingBrevo, setTestingBrevo] = useState(false);
  const [testingLemlist, setTestingLemlist] = useState(false);
  const [brevoStatus, setBrevoStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [lemlistStatus, setLemlistStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ sessions: 0, leads: 0, lastActivity: '-' });

  useEffect(() => {
    async function loadStats() {
      if (!profile) return;
      const { data } = await supabase
        .from('scraping_sessions')
        .select('created_at, actual_results')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        const totalLeads = data.reduce((acc, curr) => acc + (curr.actual_results || 0), 0);
        const lastDate = new Date(data[0].created_at).toLocaleDateString('fr-FR');
        setStats({
          sessions: data.length,
          leads: totalLeads,
          lastActivity: lastDate
        });
      }
    }
    loadStats();
  }, [profile]);

  const handleDeleteAccount = () => {
    showConfirm(
      'Supprimer le compte',
      'Êtes-vous absolument sûr ? Cette action est irréversible. Toutes vos données seront définitivement supprimées.',
      async () => {
        showAlert('Action requise', 'Contactez le support pour supprimer votre compte : support@hallprospects.com', 'info');
      },
      'danger',
      'Supprimer définitivement'
    );
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profileData.full_name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (error) {
      showNotification('error', 'Erreur lors de la sauvegarde');
    } else {
      showNotification('success', 'Profil mis à jour !');
      await refreshProfile();
    }

    setSaving(false);
  };

  const updatePassword = async () => {
    if (passwords.new.length < 6) {
      showNotification('error', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      showNotification('error', 'Les mots de passe ne correspondent pas');
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new });

    if (error) {
      showNotification('error', 'Erreur changement mot de passe : ' + error.message);
    } else {
      showNotification('success', 'Mot de passe mis à jour avec succès');
      setPasswords({ new: '', confirm: '' });
    }
    setSaving(false);
  };

  useEffect(() => {
    if (settings) {
      setBrevoKey(settings.brevo_api_key || '');
      setLemlistKey(settings.lemlist_api_key || '');
    }
  }, [settings]);

  const testBrevoKey = async () => {
    if (!brevoKey.trim()) return;
    setTestingBrevo(true);
    setBrevoStatus('idle');
    try {
      const res = await fetch('https://api.brevo.com/v3/account', {
        headers: { 'api-key': brevoKey.trim() },
      });
      setBrevoStatus(res.ok ? 'ok' : 'error');
    } catch {
      setBrevoStatus('error');
    }
    setTestingBrevo(false);
  };

  const testLemlistKey = async () => {
    if (!lemlistKey.trim()) return;
    setTestingLemlist(true);
    setLemlistStatus('idle');
    try {
      const res = await fetch('https://api.lemlist.com/api/team', {
        headers: { Authorization: `Bearer ${lemlistKey.trim()}` },
      });
      setLemlistStatus(res.ok ? 'ok' : 'error');
    } catch {
      setLemlistStatus('error');
    }
    setTestingLemlist(false);
  };

  const saveIntegrationKeys = async () => {
    await updateSettings({
      brevo_api_key: brevoKey.trim() || null,
      lemlist_api_key: lemlistKey.trim() || null,
    } as Partial<UserSettings>);
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', profile.id);

      if (error) throw error;

      showNotification('success', 'Paramètres mis à jour !');
      await refreshSettings();
    } catch (error: any) {
      console.error('Erreur settings:', error);
      showNotification('error', `Erreur : ${error.message || 'Mise à jour impossible'}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Paramètres</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gérez votre compte et vos préférences
        </p>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'profile'
            ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/30'
            }`}
        >
          <User className="w-4 h-4" />
          Profil
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'config'
            ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/30'
            }`}
        >
          <SettingsIcon className="w-4 h-4" />
          Configuration
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'integrations'
            ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/30'
            }`}
        >
          <Plug className="w-4 h-4" />
          Intégrations
        </button>
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Identity Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 h-fit">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Mes Informations</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Prénom / Nom d'affichage
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  placeholder="Votre nom"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Adresse Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-xl cursor-not-allowed opacity-70"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Security Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Sécurité</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={updatePassword}
                  disabled={saving || !passwords.new}
                  className="w-full py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mettre à jour le mot de passe
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h2 className="font-bold text-red-800 dark:text-red-300">Zone de danger</h2>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 hover:underline transition-colors"
              >
                Supprimer mon compte définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIG TAB */}
      {activeTab === 'config' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-2xl">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Préférences Scraping</h2>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Limite de résultats par défaut
              </label>
              <input
                type="number"
                value={settings?.default_limit ?? 10}
                onChange={(e) => updateSettings({ default_limit: Number(e.target.value) })}
                min={1}
                max={500}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Définit le nombre de leads recherchés automatiquement lors d'un nouveau scraping.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* INTEGRATIONS TAB */}
      {activeTab === 'integrations' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-2xl space-y-6">

          {/* Brevo */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M3 8l9 6 9-6" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/><path d="M3 8v8a2 2 0 002 2h14a2 2 0 002-2V8" stroke="#2563eb" strokeWidth="2"/><path d="M3 8l9-4 9 4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">Brevo</h2>
                  <p className="text-xs text-gray-500">Emails marketing, newsletters, contacts</p>
                </div>
              </div>
              {brevoStatus === 'ok' && (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 text-xs font-bold rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connecté
                </span>
              )}
              {brevoStatus === 'error' && (
                <span className="flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-bold rounded-lg">
                  <XCircle className="w-3.5 h-3.5" /> Clé invalide
                </span>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Clé API Brevo
              </label>
              <div className="relative">
                <input
                  type={showBrevoKey ? 'text' : 'password'}
                  value={brevoKey}
                  onChange={(e) => { setBrevoKey(e.target.value); setBrevoStatus('idle'); }}
                  placeholder="xkeysib-xxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-3 pr-20 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowBrevoKey(!showBrevoKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  {showBrevoKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Dashboard Brevo → SMTP & API → Clés API
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={testBrevoKey}
                  disabled={testingBrevo || !brevoKey.trim()}
                  className="px-4 py-2 text-sm font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all disabled:opacity-50"
                >
                  {testingBrevo ? 'Test...' : 'Tester la connexion'}
                </button>
              </div>
            </div>
          </div>

          {/* Lemlist */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="#7c3aed" opacity="0.3"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">Lemlist</h2>
                  <p className="text-xs text-gray-500">Cold emailing B2B, séquences automatisées</p>
                </div>
              </div>
              {lemlistStatus === 'ok' && (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 text-xs font-bold rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connecté
                </span>
              )}
              {lemlistStatus === 'error' && (
                <span className="flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-bold rounded-lg">
                  <XCircle className="w-3.5 h-3.5" /> Clé invalide
                </span>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Clé API Lemlist
              </label>
              <div className="relative">
                <input
                  type={showLemlistKey ? 'text' : 'password'}
                  value={lemlistKey}
                  onChange={(e) => { setLemlistKey(e.target.value); setLemlistStatus('idle'); }}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-3 pr-20 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-violet-500 transition-all outline-none font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowLemlistKey(!showLemlistKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  {showLemlistKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Lemlist → Settings → Integrations → API
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={testLemlistKey}
                  disabled={testingLemlist || !lemlistKey.trim()}
                  className="px-4 py-2 text-sm font-semibold bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all disabled:opacity-50"
                >
                  {testingLemlist ? 'Test...' : 'Tester la connexion'}
                </button>
              </div>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={saveIntegrationKeys}
            disabled={saving}
            className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex justify-center items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Enregistrer les clés API
          </button>
        </div>
      )}
    </div>
  );
}
