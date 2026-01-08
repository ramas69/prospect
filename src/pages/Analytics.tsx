import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, AnalyticsDaily, ScrapingSession } from '../lib/supabase';
import {
  TrendingUp,
  Users,
  Mail,
  Activity,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Clock,
  Euro,
  Target,
  ChevronRight
} from 'lucide-react';

export default function Analytics() {
  const { profile } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsDaily[]>([]);
  const [sessions, setSessions] = useState<ScrapingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [profile, timeRange]);

  const loadAnalytics = async () => {
    if (!profile) return;

    const daysAgo = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const [analyticsRes, sessionsRes] = await Promise.all([
      supabase
      .from('analytics_daily')
      .select('*')
      .eq('user_id', profile.id)
      .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true }),
      supabase
        .from('scraping_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .gte('created_at', startDate.toISOString())
    ]);

    setAnalytics(analyticsRes.data || []);
    setSessions(sessionsRes.data || []);
    setLoading(false);
  };

  const totals = analytics.reduce(
    (acc, day) => ({
      scraping_count: acc.scraping_count + day.scraping_count,
      leads_generated: acc.leads_generated + day.leads_generated,
      emails_found: acc.emails_found + day.emails_found,
      avg_duration: acc.avg_duration + day.avg_duration_seconds,
    }),
    { scraping_count: 0, leads_generated: 0, emails_found: 0, avg_duration: 0 }
  );

  // Corporate ROI Calculations
  const ESTIMATED_COST_PER_LEAD = 0.50; // 0.50€ par lead si acheté ailleurs
  const moneySaved = (totals.leads_generated * ESTIMATED_COST_PER_LEAD).toFixed(2);
  const hoursSaved = (totals.leads_generated * 2 / 60).toFixed(1); // On estime 2 min de recherche manuelle par lead

  const sectorPerformance = sessions.reduce((acc: any, session) => {
    const sector = session.sector || 'Autre';
    if (!acc[sector]) {
      acc[sector] = { name: sector, leads: 0, emails: 0, count: 0 };
    }
    acc[sector].leads += session.actual_results || 0;
    acc[sector].emails += session.emails_found || 0;
    acc[sector].count += 1;
    return acc;
  }, {});

  const sortedSectors = Object.values(sectorPerformance)
    .sort((a: any, b: any) => b.leads - a.leads)
    .slice(0, 5);

  const stats = [
    {
      name: 'Économie Estimée',
      value: `${moneySaved} €`,
      description: 'Basé sur 0.50€/lead',
      icon: Euro,
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      name: 'Temps Économisé',
      value: `${hoursSaved} h`,
      description: 'Recherche manuelle évitée',
      icon: Clock,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      name: 'Efficacité Scraping',
      value: totals.scraping_count ? (totals.leads_generated / totals.scraping_count).toFixed(0) : 0,
      description: 'Leads par session',
      icon: Target,
      color: 'orange',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      name: 'Taux d\'Emails',
      value: totals.leads_generated ? ((totals.emails_found / totals.leads_generated) * 100).toFixed(1) + '%' : '0%',
      description: 'Enrichissement moyen',
      icon: Mail,
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
  ];

  const exportData = () => {
    const headers = ['Date', 'Scraping', 'Leads', 'Emails', 'Durée Moyenne (min)'];
    const rows = analytics.map((day) => [
      day.date,
      day.scraping_count,
      day.leads_generated,
      day.emails_found,
      Math.floor(day.avg_duration_seconds / 60),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hall-prospects-roi-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Analyse Stratégique & ROI</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Mesurez l'impact réel de l'outil sur votre productivité
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm">
            {(['week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                  timeRange === range
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {range === 'week' ? '7j' : range === 'month' ? '30j' : '1an'}
              </button>
            ))}
          </div>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            Rapport ROI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all"
            >
              <div className={`p-3 ${stat.bgColor} rounded-2xl w-fit mb-4`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <p className="text-3xl font-black text-gray-800 dark:text-white mb-1">
                {stat.value}
              </p>
              <p className="text-sm font-bold text-gray-800 dark:text-white mb-1">{stat.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.description}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-gray-800 dark:text-white">Top Secteurs</h2>
              <p className="text-sm text-gray-500">Secteurs les plus porteurs</p>
            </div>
            <BarChart3 className="w-6 h-6 text-gray-400" />
          </div>
          
          <div className="space-y-6">
            {sortedSectors.length === 0 ? (
              <p className="text-center py-10 text-gray-500">Pas encore de données par secteur</p>
            ) : (
              sortedSectors.map((s: any) => (
                <div key={s.name} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-800 dark:text-white">{s.name}</span>
                    <span className="text-sm font-black text-orange-500">{s.leads} leads</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((s.leads / (totals.leads_generated || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {s.count} sessions
                    </span>
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
                      {((s.emails / (s.leads || 1)) * 100).toFixed(0)}% emails
                    </span>
                  </div>
                </div>
              ))
            )}
              </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-gray-800 dark:text-white">Historique de Performance</h2>
              <p className="text-sm text-gray-500">Évolution de la production de leads</p>
            </div>
            <Activity className="w-6 h-6 text-gray-400" />
      </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {analytics.length === 0 ? (
              <p className="text-center py-10 text-gray-500">Aucune activité enregistrée</p>
          ) : (
              [...analytics].reverse().map((day) => (
              <div
                key={day.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                >
                  <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 w-12 h-12 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">
                      {new Date(day.date).toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                    <span className="text-lg font-black text-gray-800 dark:text-white leading-none">
                      {new Date(day.date).getDate()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-sm font-bold text-gray-800 dark:text-white">{day.leads_generated} leads</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-sm font-bold text-gray-800 dark:text-white">{day.emails_found}</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                      {day.scraping_count} sessions • {Math.floor(day.avg_duration_seconds / 60)} min moy.
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            ))
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

