import React, { useState, useEffect } from 'react';
import { JobTable } from './components/JobTable';
import { SearchForm } from './components/SearchForm';
import { SearchProgress } from './components/SearchProgress';
import { FilterBar } from './components/FilterBar';
import { Schedules } from './components/Schedules';
import { History } from './components/History';
import { Login } from './components/Login';
import { Sidebar } from './components/Layout/Sidebar';
import { AuthService } from './services/auth';
import { JobService } from './services/jobs';
import { SearchService } from './services/search';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(AuthService.isLoggedIn());
  const [username, setUsername] = useState(AuthService.getUsername() || "");

  // Init auth check if needed, mostly handled by localStorage
  const [view, setView] = useState('jobs'); // jobs | new | progress | schedules
  const [jobs, setJobs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [searchState, setSearchState] = useState(null); // null | "running" | "done" | "error"
  const [searchStatus, setSearchStatus] = useState(null);
  const [prefillProfile, setPrefillProfile] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false); // Desktop sidebar state

  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    pageSize: 20,
    total_applied: 0,
    avg_score: 0
  });

  // Filter State
  const [filters, setFilters] = useState({
    min_score: "",
    max_distance: "",
    worth_applying: "",
    sort_by: "created_at",
    sort_order: "desc"
  });

  // Keep track of filters in a ref for the polling interval
  const filtersRef = React.useRef(filters);
  const paginationRef = React.useRef(pagination);

  useEffect(() => {
    filtersRef.current = filters;
    paginationRef.current = pagination;
    if (isLoggedIn) {
      fetchJobs();
    }
  }, [filters, pagination.page, isLoggedIn]); // Reload when filters or page change

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLoggedIn) {
        console.log("Tab visible - refreshing data...");
        fetchJobs(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      const interval = setInterval(() => {
        fetchJobs(true); // Pass flag to indicate polling
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const fetchJobs = async (isPolling = false) => {
    try {
      // Use the ref value for polling to avoid closure staleness
      const currentFilters = isPolling ? filtersRef.current : filters;
      const currentPage = isPolling ? paginationRef.current.page : pagination.page;
      const res = await JobService.getAll({
        ...currentFilters,
        page: currentPage,
        page_size: pagination.pageSize
      });
      setJobs(res.items || []);
      setPagination(prev => ({
        ...prev,
        total: res.total || 0,
        pages: res.pages || 1,
        page: res.page || 1,
        total_applied: res.total_applied || 0,
        avg_score: res.avg_score || 0
      }));
    } catch (error) {
      if (error.message === "UNAUTHORIZED") {
        handleLogout();
        return;
      }
      console.error("Fetch jobs error:", error);
    }
  };

  const handleLogin = (user) => {
    setUsername(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsLoggedIn(false);
    setUsername("");
    setJobs([]);
    setActiveProfileId(null);
    setSearchState(null);
    setView('jobs');
  };

  const handleStartSearch = async (profile) => {
    setIsSearching(true);
    setSearchStatus(null);
    setPrefillProfile(null);
    try {
      const result = await SearchService.start(profile);
      setActiveProfileId(result.profile_id);
      setSearchState("running");
      setView('progress');
    } catch (error) {
      if (error.message === "UNAUTHORIZED") { handleLogout(); return; }
      alert("Failed to start search: " + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleEditHistory = (profile) => {
    setPrefillProfile(profile);
    setView('new');
  };

  const handleSaveAsSchedule = async (profile) => {
    try {
      await SearchService.toggleSchedule(profile.id, true, profile.schedule_interval_hours || 24);
      alert("Search profile added to schedules!");
    } catch (error) {
      alert("Failed to save schedule: " + error.message);
    }
  };

  const handleSearchStateChange = (state) => {
    if (state === "done" || state === "error") {
      setSearchState(state === "done" ? "done" : "error");
      fetchJobs();
    }
  };

  const handleClearSearch = () => {
    setActiveProfileId(null);
    setSearchState(null);
    setSearchStatus(null);
    setView('jobs');
  };

  const toggleApplied = async (job) => {
    try {
      const updated = await JobService.toggleApplied(job.id, !job.applied);
      setJobs(prev => prev.map(j => j.id === job.id ? updated : j));
    } catch (error) {
      if (error.message === "UNAUTHORIZED") { handleLogout(); return; }
      console.error("Failed to update job", error);
    }
  };

  // ─── Not logged in ───
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // ─── Logged in ───
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  // Use backend stats instead of client-side calculation
  const totalJobs = pagination.total;
  const appliedCount = pagination.total_applied;
  const avgScore = Math.round(pagination.avg_score || 0);

  const StatCard = ({ label, value, color, icon }) => (
    <div className="glass-panel p-4 d-flex align-items-center hover-card h-100">
      <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 bg-${color}-10 text-${color}`} 
           style={{ width: 48, height: 48 }}>
        <i className={`bi ${icon} fs-4`}></i>
      </div>
      <div>
        <div className="h3 fw-bold mb-0 text-white">{value}</div>
        <div className="text-secondary small fw-medium text-uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="d-flex min-vh-100 position-relative">
      {/* Mobile Sidebar Backdrop */}
      <div 
        className={`sidebar-backdrop ${isSidebarOpen ? 'show' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <Sidebar 
        view={view} 
        setView={setView} 
        searchState={searchState} 
        totalJobs={totalJobs}
        username={username}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isDesktopSidebarCollapsed}
        onToggleCollapse={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
      />

      {/* Main Content - Offset */}
      <div className={`flex-grow-1 w-100 ${isDesktopSidebarCollapsed ? 'd-lg-ml-80' : 'd-lg-ml-280'}`} style={{ transition: 'margin 0.3s ease, width 0.3s ease' }}>
        <div className="container-fluid p-2 p-lg-5">
          
          {/* Header Area */}
          <div className="d-flex justify-content-between align-items-start mb-4 mb-lg-5 animate-fade-in pt-4 pt-lg-0">
            <div className="d-flex align-items-center">
              {/* Hamburger Menu - Visible only on mobile */}
              <button 
                className="btn btn-icon btn-secondary me-3 d-lg-none"
                onClick={() => setIsSidebarOpen(true)}
              >
                <i className="bi bi-list fs-4"></i>
              </button>
              
              <div>
                <h1 className="fw-bold text-white mb-1 d-none d-md-block">
                  {view === 'jobs' && 'Dashboard'}
                  {view === 'new' && 'New Search'}
                  {view === 'schedules' && 'Schedules'}
                  {view === 'history' && 'Search History'}
                  {view === 'progress' && 'Search in Progress'}
                </h1>
                <h4 className="fw-bold text-white mb-0 d-md-none">
                  {view === 'jobs' && 'Dashboard'}
                  {view === 'new' && 'New Search'}
                  {view === 'schedules' && 'Schedules'}
                  {view === 'history' && 'History'}
                  {view === 'progress' && 'Progress'}
                </h4>
                <p className="text-secondary mb-0 d-none d-md-block">
                  {view === 'jobs' && 'Overview of your search activities'}
                  {view === 'new' && 'Configure and launch a new search'}
                  {view === 'schedules' && 'Manage your automated searches'}
                  {view === 'history' && 'Review your search history'}
                  {view === 'progress' && 'Real-time search status'}
                </p>
              </div>
            </div>

            </div>

          <div className="animate-slide-up">
            {view === 'new' ? (
              <div className="w-100 h-100">
                <SearchForm
                  onStartSearch={handleStartSearch}
                  isLoading={isSearching}
                  prefill={prefillProfile}
                />
              </div>
            ) : view === 'schedules' ? (
              <Schedules />
            ) : view === 'history' ? (
              <History onStartSearch={handleStartSearch} onEdit={handleEditHistory} onSaveAsSchedule={handleSaveAsSchedule} />
            ) : view === 'jobs' ? (
              <>
                {/* Stats Row */}
                <div className="row g-3 g-md-4 mb-4 mb-md-5">
                  <div className="col-12 col-md-4">
                    <StatCard 
                      label="Jobs Found" 
                      value={totalJobs} 
                      color="primary" 
                      icon="bi-briefcase-fill"
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <StatCard 
                      label="Avg Match" 
                      value={`${avgScore}%`} 
                      color="warning" 
                      icon="bi-pie-chart-fill"
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <StatCard 
                      label="Applied" 
                      value={appliedCount} 
                      color="success" 
                      icon="bi-send-check-fill"
                    />
                  </div>
                </div>

                {/* Filter & Table Section */}
                <div className="glass-panel overflow-hidden d-flex flex-column">
                  <div className="p-3 border-bottom border-white-10 bg-black-20 transition-all">
                     <FilterBar
                      filters={filters}
                      onChange={setFilters}
                      onRefresh={() => fetchJobs()}
                      onClear={() => setFilters({
                        min_score: "",
                        max_distance: "",
                        worth_applying: "",
                        sort_by: "created_at",
                        sort_order: "desc"
                      })}
                    />
                  </div>
                  <JobTable
                    jobs={safeJobs}
                    onToggleApplied={toggleApplied}
                    pagination={pagination}
                    onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
                  />
                </div>
              </>
            ) : null}
          </div>

          {/* SearchProgress stays mounted (hidden) to preserve polling state */}
          {activeProfileId && (
            <div style={{ display: view === 'progress' ? 'block' : 'none' }}>
              <SearchProgress
                profileId={activeProfileId}
                status={searchStatus}
                setStatus={setSearchStatus}
                onStateChange={handleSearchStateChange}
                onClear={handleClearSearch}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
