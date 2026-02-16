import React, { useState, useEffect } from 'react';
import { JobTable } from './components/JobTable';
import { SearchForm } from './components/SearchForm';
import { SearchProgress } from './components/SearchProgress';
import { FilterBar } from './components/FilterBar';
import { Schedules } from './components/Schedules';
import { History } from './components/History';
import { Login } from './components/Login';
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

  return (
    <div className="pb-5">
      {/* Navbar - Glass Effect */}
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top navbar-glass">
        <div className="container">
          <span className="navbar-brand fw-bold d-flex align-items-center fs-4">
            <div className="rounded-circle bg-primary bg-gradient d-flex align-items-center justify-content-center me-2" style={{ width: 38, height: 38, boxShadow: 'var(--shadow-glow)' }}>
              <i className="bi bi-search text-white" style={{ fontSize: '1.1rem' }}></i>
            </div>
            <span className="tracking-tight" style={{ fontWeight: 700 }}>JobHunter</span>
          </span>

          <button className="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <div className="navbar-nav nav-pills ms-auto mb-2 mb-lg-0 gap-1 align-items-center">
              <button
                className={`nav-link btn btn-link text-start ${view === 'jobs' ? 'active' : ''}`}
                onClick={() => { setView('jobs'); }}
              >
                <i className="bi bi-grid-fill me-2"></i>Dashboard
                {totalJobs > 0 && <span className="badge bg-white text-dark ms-2 rounded-pill small" style={{ fontSize: '0.7em' }}>{totalJobs}</span>}
              </button>

              {/* Persistent search tab */}
              {activeProfileId && (
                <button
                  className={`nav-link btn btn-link text-start ${view === 'progress' ? 'active' : ''} ${searchState === 'done' ? 'text-success' : searchState === 'error' ? 'text-danger' : 'text-warning'}`}
                  onClick={() => setView('progress')}
                >
                  {searchState === 'running' && <><i className="bi bi-arrow-clockwise me-2 spinner-border-sm"></i>Searching</>}
                  {searchState === 'done' && <><i className="bi bi-check-circle-fill me-2"></i>Results</>}
                  {searchState === 'error' && <><i className="bi bi-exclamation-triangle-fill me-2"></i>Error</>}
                </button>
              )}

              <button
                className={`nav-link btn btn-link text-start ${view === 'schedules' ? 'active' : ''}`}
                onClick={() => setView('schedules')}
              >
                <i className="bi bi-alarm-fill me-2"></i>Schedules
              </button>

              <button
                className={`nav-link btn btn-link text-start ${view === 'history' ? 'active' : ''}`}
                onClick={() => setView('history')}
              >
                <i className="bi bi-clock-history me-2"></i>History
              </button>

              <button
                className={`nav-link btn btn-link text-start ${view === 'new' ? 'active' : ''}`}
                onClick={() => setView('new')}
              >
                <i className="bi bi-plus-circle-fill me-2"></i>New Search
              </button>
            </div>

            {/* User / Logout */}
            <div className="d-flex align-items-center gap-3 ps-lg-4 ms-lg-2 pt-3 pt-lg-0 border-start border-secondary border-opacity-10">
              <div className="d-flex align-items-center text-secondary">
                <div className="bg-secondary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 32, height: 32 }}>
                  <i className="bi bi-person-fill text-white"></i>
                </div>
                <small className="fw-medium text-white-50">{username}</small>
              </div>
              <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={handleLogout} title="Sign Out">
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container py-4 mt-5 pt-5">
        <div className="mt-4">
          {view === 'new' ? (
            <div className="animate-fade-in text-center py-2">
              <h2 className="display-6 fw-bold mb-4">
                {prefillProfile ? 'Edit Search Profile' : 'Start New Search'}
              </h2>
              <div className="mx-auto">
                <SearchForm
                  onStartSearch={handleStartSearch}
                  isLoading={isSearching}
                  prefill={prefillProfile}
                />
              </div>
            </div>
          ) : view === 'schedules' ? (
            <Schedules />
          ) : view === 'history' ? (
            <History onStartSearch={handleStartSearch} onEdit={handleEditHistory} onSaveAsSchedule={handleSaveAsSchedule} />
          ) : view === 'jobs' ? (
            <div className="animate-fade-in py-1">
              {/* Stats Row */}
              <div className="row g-4 mb-5">
                <div className="col-12 col-md-4">
                  <div className="glass-card p-4 text-center h-100 d-flex flex-column justify-content-center">
                    <div className="display-5 fw-bold text-gradient mb-1">{totalJobs}</div>
                    <div className="text-secondary fw-semibold text-uppercase tracking-wider small opacity-75">
                      Total Jobs Found
                    </div>
                  </div>
                </div>
                <div className="col-6 col-md-4">
                  <div className="glass-card p-4 text-center h-100 d-flex flex-column justify-content-center">
                    <div className="display-5 fw-bold text-warning mb-1">{avgScore}%</div>
                    <div className="text-secondary fw-semibold text-uppercase tracking-wider small opacity-75">Avg Match Score</div>
                  </div>
                </div>
                <div className="col-6 col-md-4">
                  <div className="glass-card p-4 text-center h-100 d-flex flex-column justify-content-center">
                    <div className="display-5 fw-bold text-success mb-1">{appliedCount}</div>
                    <div className="text-secondary fw-semibold text-uppercase tracking-wider small opacity-75">Applications Sent</div>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="d-flex justify-content-between align-items-end mb-4">
                <div>
                  <h4 className="mb-1 text-white fw-bold">Job Results</h4>
                  <p className="text-secondary small mb-0">Browse and manage your scraped opportunities</p>
                </div>
                <button onClick={() => fetchJobs()} className="btn btn-sm btn-secondary rounded-pill px-3">
                  <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                </button>
              </div>

              <FilterBar
                filters={filters}
                onChange={setFilters}
                onClear={() => setFilters({
                  min_score: "",
                  max_distance: "",
                  worth_applying: "",
                  sort_by: "created_at",
                  sort_order: "desc"
                })}
              />

              <JobTable
                jobs={safeJobs}
                onToggleApplied={toggleApplied}
                pagination={pagination}
                onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
              />  </div>
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
  );
}

export default App;
