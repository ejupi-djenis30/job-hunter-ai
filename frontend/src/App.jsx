import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SearchProvider } from './context/SearchContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './components/Login';
import { Sidebar } from './components/Layout/Sidebar';

import { JobsPage } from './pages/JobsPage';
import { NewSearchPage } from './pages/NewSearchPage';
import { SchedulesPage } from './pages/SchedulesPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProgressPage } from './pages/ProgressPage';

function DashboardLayout() {
  const { isLoggedIn, user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

  if (!isLoggedIn) {
      return <Login />;
  }

  const getPageContext = (pathname) => {
    switch (pathname) {
      case '/jobs': return { title: 'Dashboard', desc: 'Overview of your search activities' };
      case '/new': return { title: 'New Search', desc: 'Configure and launch a new search' };
      case '/schedules': return { title: 'Schedules', desc: 'Manage your automated searches' };
      case '/history': return { title: 'Search History', desc: 'Review your search history' };
      case '/progress': return { title: 'Search in Progress', desc: 'Real-time search status' };
      default: return { title: 'JobHunter', desc: '' };
    }
  };

  const currentContext = getPageContext(location.pathname);

  return (
    <>
      <div className="animated-bg">
        <div className="animated-bg-blob blob-1"></div>
        <div className="animated-bg-blob blob-2"></div>
        <div className="animated-bg-blob blob-3"></div>
      </div>
      
      <div className="d-flex min-vh-100 position-relative overflow-hidden">
        <div className={`sidebar-backdrop ${isSidebarOpen ? 'show' : ''}`} onClick={() => setIsSidebarOpen(false)} />

        <Sidebar 
          username={user}
          onLogout={logout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isDesktopSidebarCollapsed}
          onToggleCollapse={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
        />

        <div className={`flex-grow-1 w-100 ${isDesktopSidebarCollapsed ? 'd-lg-ml-80' : 'd-lg-ml-280'}`} style={{ transition: 'margin 0.3s ease, width 0.3s ease' }}>
          <div className="container-fluid p-2 p-lg-5">
            <div className="d-flex justify-content-between align-items-start mb-4 mb-lg-5 pt-4 pt-lg-0">
              <div className="d-flex align-items-center">
                <button className="btn btn-icon btn-secondary me-3 d-lg-none" onClick={() => setIsSidebarOpen(true)}>
                  <i className="bi bi-list fs-4"></i>
                </button>
                <div>
                  <h1 className="fw-bold text-white mb-1 d-none d-md-block">{currentContext.title}</h1>
                  <h4 className="fw-bold text-white mb-0 d-md-none">{currentContext.title}</h4>
                  <p className="text-secondary mb-0 d-none d-md-block">{currentContext.desc}</p>
                </div>
              </div>
            </div>

            <Routes>
                <Route path="/" element={<Navigate to="/jobs" replace />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/new" element={<NewSearchPage />} />
                <Route path="/schedules" element={<SchedulesPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="*" element={<Navigate to="/jobs" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SearchProvider>
          <ToastProvider>
            <DashboardLayout />
          </ToastProvider>
        </SearchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
