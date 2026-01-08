import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  Users,
  Mail,
  TrendingUp,
  Calendar,
  Search,
  ArrowUpRight,
  Database,
  Target
} from 'lucide-react';

export default function DashboardOverview() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalEmails: 0,
    totalSessions: 0,
    emailRate: 0,
    avgLeads: 0
  });
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [sectorData, setSectorData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!profile) return;

      const { data: sessions } = await supabase
        .from('scraping_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (sessions && sessions.length > 0) {
        // 1. Global KPIs
        const totalLeads = sessions.reduce((acc, s) => acc + (s.actual_results || 0), 0);
        const totalEmails = sessions.reduce((acc, s) => acc + (s.emails_found || 0), 0);
        const emailRate = totalLeads > 0 ? Math.round((totalEmails / totalLeads) * 100) : 0;
        const avgLeads = sessions.length > 0 ? Math.round(totalLeads / sessions.length) : 0;

        setStats({
          totalLeads,
          totalEmails,
          totalSessions: sessions.length,
          emailRate,
          avgLeads
        });

        // 2. Daily Trend (Last 7 Days)
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const trend = last7Days.map(date => {
          const daySessions = sessions.filter(s => s.created_at.startsWith(date));
          const leads = daySessions.reduce((acc, s) => acc + (s.actual_results || 0), 0);
          return {
            name: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' }),
            leads: leads,
            fullDate: date
          };
        });
        setDailyData(trend);

        // 3. Recent Activity
        setRecentSessions(sessions.slice(0, 5));

        // 4. Sector Distribution
        const sectors: Record<string, number> = {};
        sessions.forEach(s => {
          const sector = s.sector || 'Autre';
          sectors[sector] = (sectors[sector] || 0) + (s.actual_results || 0);
        });

        const pieData = Object.entries(sectors)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5); // Top 5 sectors

        setSectorData(pieData);
      }
      setLoading(false);
    }

    loadDashboardData();
  }, [profile]);

  const COLORS = ['#F97316', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Tableau de Bord</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Aperçu de votre performance de prospection
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
              <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
              <TrendingUp className="w-3 h-3 mr-1" />
              Total
            </span>
          </div>
          <p className="text-3xl font-black text-gray-800 dark:text-white">{stats.totalLeads}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Leads générés</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="flex items-center text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
              {stats.emailRate}% Taux
            </span>
          </div>
          <p className="text-3xl font-black text-gray-800 dark:text-white">{stats.totalEmails}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Emails trouvés</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-800 dark:text-white">{stats.totalSessions}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Sessions de scraping</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm border-b-4 border-b-red-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <Target className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-xl font-black text-gray-800 dark:text-white truncate" title={sectorData[0]?.name || ''}>
            {sectorData[0]?.name || 'Aucun'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
            Top Secteur ({sectorData[0]?.value || 0} leads)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Performance Hebdomadaire</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Nombre de leads extraits ces 7 derniers jours</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#F97316"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorLeads)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Sectors */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Top Secteurs</h2>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{stats.totalLeads}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {sectorData.map((sector, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-gray-600 dark:text-gray-300">{sector.name}</span>
                </div>
                <span className="font-bold text-gray-800 dark:text-white">{sector.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Dernières Activités</h2>
          <button onClick={() => navigate('/history')} className="text-sm font-semibold text-orange-600 hover:text-orange-700">Voir tout</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Secteur</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Localisation</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Résultats</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentSessions.map((session) => (
                <tr
                  key={session.id}
                  onClick={() => navigate(`/history?session_id=${session.id}`)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                >
                  <td className="px-8 py-4">
                    <div className="font-bold text-gray-800 dark:text-white">{session.sector}</div>
                  </td>
                  <td className="px-8 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {session.location}
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-800 dark:text-white">{session.actual_results}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(session.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-8 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${session.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      session.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                      {session.status === 'completed' ? 'Terminé' : session.status === 'in_progress' ? 'En cours' : 'Attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
