import React, { useState, useEffect } from 'react';
import { JobTable } from './components/JobTable';
import { SearchForm } from './components/SearchForm';
import { SearchProgress } from './components/SearchProgress';
import { FilterBar } from './components/FilterBar';
import { Schedules } from './components/Schedules';
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

  // Filter State
  const [filters, setFilters] = useState({
    min_score: "",
    max_distance: "",
    worth_applying: "",
    sort_by: "created_at",
    sort_order: "desc"
  });

  useEffect(() => {
    if (isLoggedIn) {
      fetchJobs();
    }
  }, [filters]); // Reload when filters change

  useEffect(() => {
    if (isLoggedIn) {
      fetchJobs(); // Initial load
      const interval = setInterval(fetchJobs, 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const fetchJobs = async () => {
    try {
      const data = await JobService.getAll(filters);
      setJobs(Array.isArray(data) ? data : []); // Backend handles sorting now
    } catch (error) {
      if (error.message === "UNAUTHORIZED") {
        handleLogout();
        return;
      }
      console.error("Failed to fetch jobs", error);
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

  const handleSearchStateChange = (state) => {
    if (state === "done" || state === "error") {
      setSearchState(state === "done" ? "done" : "error");
      fetchJobs();
    }
  };

  const handleClearSearch = () => {
    setActiveProfileId(null);
    setSearchState(null);
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
  const totalJobs = safeJobs.length;
  const appliedCount = safeJobs.filter(j => j.applied).length;
  const avgScore = totalJobs > 0 ? Math.round(safeJobs.reduce((acc, j) => acc + (j.affinity_score || 0), 0) / totalJobs) : 0;

  return (
    <div className="min-vh-100 text-light">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top border-bottom border-secondary border-opacity-10" style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)' }}>
        <div className="container">
          <span className="navbar-brand fw-bold d-flex align-items-center fs-4">
            <div className="rounded-circle bg-primary bg-gradient d-flex align-items-center justify-content-center me-2" style={{ width: 40, height: 40, boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)' }}>
              <i className="bi bi-search text-white"></i>
            </div>
            <span className="tracking-tight">JobHunter<span className="text-secondary opacity-50">.ai</span></span>
          </span>

          <button className="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <div className="navbar-nav ms-auto mb-2 mb-lg-0 gap-1">
              <button
                className={`nav-link btn btn-link text-start px-3 rounded-pill ${view === 'jobs' ? 'active bg-white bg-opacity-10 text-white fw-medium' : 'text-secondary'}`}
                onClick={() => { setView('jobs'); }}
              >
                <i className="bi bi-grid me-2"></i>Dashboard
                {totalJobs > 0 && <span className="badge bg-primary rounded-pill ms-2">{totalJobs}</span>}
              </button>

              {/* Persistent search tab */}
              {activeProfileId && (
                <button
                  className={`nav-link btn btn-link text-start px-3 rounded-pill ${view === 'progress' ? 'active bg-white bg-opacity-10' : ''} ${searchState === 'done' ? 'text-success' : searchState === 'error' ? 'text-danger' : 'text-warning'}`}
                  onClick={() => setView('progress')}
                >
                  {searchState === 'running' && <><i className="bi bi-arrow-clockwise me-2 spinner-border-sm"></i>Searching</>}
                  {searchState === 'done' && <><i className="bi bi-check-circle me-2"></i>Results</>}
                  {searchState === 'error' && <><i className="bi bi-exclamation-triangle me-2"></i>Error</>}
                </button>
              )}

              <button
                className={`nav-link btn btn-link text-start px-3 rounded-pill ${view === 'schedules' ? 'active bg-white bg-opacity-10 text-white fw-medium' : 'text-secondary'}`}
                onClick={() => setView('schedules')}
              >
                <i className="bi bi-clock me-2"></i>Schedules
              </button>

              <button
                className={`nav-link btn btn-link text-start px-3 rounded-pill ${view === 'new' ? 'active bg-white bg-opacity-10 text-white fw-medium' : 'text-secondary'}`}
                onClick={() => setView('new')}
              >
                <i className="bi bi-plus-lg me-2"></i>New Search
              </button>
            </div>

            {/* User / Logout */}
            <div className="d-flex align-items-center gap-3 border-start border-secondary border-opacity-25 ms-lg-3 ps-lg-3 pt-2 pt-lg-0">
              <div className="d-flex align-items-center text-secondary">
                <div className="avatar bg-white bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 32, height: 32 }}>
                  <i className="bi bi-person-fill"></i>
                </div>
                <small className="fw-medium">{username}</small>
              </div>
              <button className="btn btn-sm btn-outline-secondary rounded-pill px-3 border-opacity-25" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container py-5 mt-5">
        {view === 'new' ? (
          <div className="animate-fade-in text-center py-5">
            <h2 className="display-5 fw-bold mb-4">Launch New Search</h2>
            <div className="mx-auto">
              <SearchForm onStartSearch={handleStartSearch} isLoading={isSearching} />
            </div>
          </div>
        ) : view === 'schedules' ? (
          <Schedules />
        ) : view === 'jobs' ? (
          <div className="animate-fade-in">
            {/* Stats Row */}
            <div className="row g-4 mb-5">
              <div className="col-12 col-md-4">
                <div className="glass-card p-4 text-center h-100 position-relative overflow-hidden group">
                  <div className="position-absolute top-0 end-0 p-3 opacity-10">
                    <i className="bi bi-briefcase fs-1"></i>
                  </div>
                  <div className="display-4 fw-bold text-gradient mb-1">{totalJobs}</div>
                  <div className="text-secondary fw-medium text-uppercase tracking-wider small">Total Jobs</div>
                </div>
              </div>
              <div className="col-6 col-md-4">
                <div className="glass-card p-4 text-center h-100">
                  <div className="display-4 fw-bold text-warning mb-1">{avgScore}%</div>
                  <div className="text-secondary fw-medium text-uppercase tracking-wider small">Avg Match</div>
                </div>
              </div>
              <div className="col-6 col-md-4">
                <div className="glass-card p-4 text-center h-100">
                  <div className="display-4 fw-bold text-success mb-1">{appliedCount}</div>
                  <div className="text-secondary fw-medium text-uppercase tracking-wider small">Applied</div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 text-light"><i className="bi bi-list-ul me-2"></i>Job Results</h5>
              <button onClick={fetchJobs} className="btn btn-sm btn-outline-secondary">
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

            <JobTable jobs={safeJobs} onToggleApplied={toggleApplied} />
          </div>
        ) : null}

        {/* SearchProgress stays mounted (hidden) to preserve polling state */}
        {activeProfileId && (
          <div style={{ display: view === 'progress' ? 'block' : 'none' }}>
            <SearchProgress
              profileId={activeProfileId}
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
