import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useModal } from '../contexts/ModalContext';
import {
  LayoutDashboard,
  Search,
  History,
  BookmarkPlus,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  Users,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const { effectiveTheme, setTheme } = useTheme();
  const { showConfirm } = useModal();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const navigationItems = [
    { name: 'Tableau de bord', icon: LayoutDashboard, path: '/' },
    { name: 'Nouvelle Recherche', icon: Search, path: '/scraping' },
    { name: 'Mes Recherches', icon: History, path: '/history' },
    { name: 'Mes Prospects', icon: Users, path: '/prospects' },
    { name: 'Modèles', icon: BookmarkPlus, path: '/templates' },
    { name: 'Performance', icon: BarChart3, path: '/analytics' },
  ];

  const handleSignOut = () => {
    showConfirm(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      async () => {
        await signOut();
        navigate('/login', { replace: true });
      },
      'warning',
      'Se déconnecter'
    );
  };

  const toggleTheme = () => {
    setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900 transition-colors">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg"
      >
        <Menu className="w-6 h-6 text-gray-800 dark:text-white" />
      </button>

      {/* Sidebar - Narrow Style like the image */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full px-3 py-6">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-[spin_3s_linear_infinite]" />
            </div>
            <span className="text-lg font-black text-gray-800 dark:text-white tracking-tight">Prospect</span>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 flex flex-col gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${isActive
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-semibold'
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-700 dark:hover:text-gray-200'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto flex flex-col gap-1 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-700 dark:hover:text-gray-200 transition-all text-sm font-medium"
            >
              {effectiveTheme === 'dark' ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
              <span>{effectiveTheme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-700 dark:hover:text-gray-200 transition-all text-sm font-medium"
            >
              <Settings className="w-5 h-5 shrink-0" />
              <span>Paramètres</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm font-medium"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span>Déconnexion</span>
            </button>
            <div className="flex items-center gap-3 px-3 py-3 mt-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <div className="relative shrink-0">
                <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900 rounded-xl overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm">
                  <img
                    src={`https://i.pravatar.cc/150?u=${profile?.id}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{profile?.full_name || 'Utilisateur'}</p>
                <p className="text-[10px] text-gray-400 truncate">{profile?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="lg:ml-56 min-h-screen transition-all">
        <div className="p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
