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
    { name: 'Nouveau Scraping', icon: Search, path: '/scraping' },
    { name: 'Historique', icon: History, path: '/history' },
    { name: 'Gestion Prospects', icon: Users, path: '/prospects' },
    { name: 'Modèles', icon: BookmarkPlus, path: '/templates' },
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
        className={`fixed inset-y-0 left-0 z-50 w-20 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full items-center py-6">
          {/* Logo */}
          <div className="mb-10">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-[spin_3s_linear_infinite]" />
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 flex flex-col gap-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/'}
                  title={item.name}
                  className={({ isActive }) =>
                    `group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 ${isActive
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                      : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-600 dark:hover:text-gray-200'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <div className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                    {item.name}
                  </div>
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto flex flex-col gap-4 items-center">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
            >
              {effectiveTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleSignOut}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div className="relative mt-2">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-2xl overflow-hidden border-2 border-white dark:border-gray-800 shadow-md">
                <img
                  src={`https://i.pravatar.cc/150?u=${profile?.id}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
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
      <main className="lg:ml-20 min-h-screen transition-all">
        <div className="p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
