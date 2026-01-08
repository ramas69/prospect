import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ModalProvider } from './contexts/ModalContext';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import DashboardOverview from './pages/DashboardOverview';

import NewScraping from './pages/NewScraping';
import History from './pages/History';
import Prospects from './pages/Prospects';
import Analytics from './pages/Analytics';
import Templates from './pages/Templates';
import Settings from './pages/Settings';
import Tutorial from './components/Tutorial';

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
      <Tutorial onComplete={() => { }} />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <ModalProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedLayout />}>
                  <Route path="/" element={<DashboardOverview />} />
                  <Route path="/scraping" element={<NewScraping />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/prospects" element={<Prospects />} />
                  <Route path="/templates" element={<Templates />} />

                  <Route path="/settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ModalProvider>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
