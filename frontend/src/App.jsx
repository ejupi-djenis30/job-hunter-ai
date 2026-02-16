import React, { useState, useEffect } from 'react';
import { JobTable } from './components/JobTable';
import { SearchForm } from './components/SearchForm';
import { SearchProgress } from './components/SearchProgress';
import { Schedules } from './components/Schedules';
import { Login } from './components/Login';
import { AuthService } from './services/auth';
import { JobService } from './services/jobs';
import { SearchService } from './services/search';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(AuthService.isLoggedIn());
  const [username, setUsername] = useState(AuthService.getUsername() || "");

  // Init auth check if needed, mostly handled by localStorage
  const [view, setView] = useState('jobs'); // jobs | new | progress | schedules
  const [jobs, setJobs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [searchState, setSearchState] = useState(null); // null | "running" | "done" | "error"

  useEffect(() => {
    if (isLoggedIn) {
      fetchJobs();
      const interval = setInterval(fetchJobs, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const fetchJobs = async () => {
    try {
      const data = await JobService.getAll();
      const sorted = data.sort((a, b) => (b.affinity_score || 0) - (a.affinity_score || 0));
      setJobs(sorted);
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
      const updated = await JobService.update(job.id, { applied: !job.applied });
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
  const totalJobs = jobs.length;
  const appliedCount = jobs.filter(j => j.applied).length;
  const avgScore = totalJobs > 0 ? Math.round(jobs.reduce((acc, j) => acc + (j.affinity_score || 0), 0) / totalJobs) : 0;

  return (
    <div className="min-vh-100">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary sticky-top">
        <div className="container">
          <span className="navbar-brand fw-bold d-flex align-items-center">
            <i className="bi bi-crosshair me-2 text-primary"></i>
            JobHunter<span className="text-primary">.ai</span>
          </span>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <div className="navbar-nav me-auto mb-2 mb-lg-0">
              <button
                className={`nav-link btn btn-link text-start ${view === 'jobs' ? 'active text-primary' : ''}`}
                onClick={() => { setView('jobs'); }}
              >
                <i className="bi bi-layout-text-sidebar-reverse me-1"></i>
                Dashboard {totalJobs > 0 && <span className="badge bg-secondary ms-1">{totalJobs}</span>}
              </button>

              {/* Persistent search tab */}
              {activeProfileId && (
                <button
                  className={`nav-link btn btn-link text-start ${view === 'progress' ? 'active' : ''} ${searchState === 'done' ? 'text-success' : searchState === 'error' ? 'text-danger' : 'text-warning'
                    }`}
                  onClick={() => setView('progress')}
                >
                  {searchState === 'running' && <><i className="bi bi-arrow-clockwise me-1 spinner-border-sm"></i>Searching...</>}
                  {searchState === 'done' && <><i className="bi bi-check-circle me-1"></i>Searched</>}
                  {searchState === 'error' && <><i className="bi bi-exclamation-triangle me-1"></i>Error</>}
                </button>
              )}

              <button
                className={`nav-link btn btn-link text-start ${view === 'schedules' ? 'active text-primary' : ''}`}
                onClick={() => setView('schedules')}
              >
                <i className="bi bi-clock-history me-1"></i> Schedules
              </button>

              <button
                className={`nav-link btn btn-link text-start ${view === 'new' ? 'active text-primary' : ''}`}
                onClick={() => setView('new')}
              >
                <i className="bi bi-plus-circle me-1"></i> New Search
              </button>
            </div>

            {/* User / Logout */}
            <div className="d-flex align-items-center gap-3 border-top border-lg-0 pt-2 pt-lg-0 mt-2 mt-lg-0">
              <div className="d-flex align-items-center text-secondary">
                <i className="bi bi-person-circle me-2"></i>
                <small>{username}</small>
              </div>
              <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-1"></i> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container py-4">
        {view === 'new' ? (
          <SearchForm onStartSearch={handleStartSearch} isLoading={isSearching} />
        ) : view === 'schedules' ? (
          <Schedules />
        ) : view === 'jobs' ? (
          <>
            {/* Stats Row */}
            <div className="row g-3 mb-4">
              <div className="col-4 col-md-3">
                <div className="card bg-dark border-secondary text-center">
                  <div className="card-body py-3">
                    <div className="fs-3 fw-bold text-primary">{totalJobs}</div>
                    <small className="text-secondary">Total Jobs</small>
                  </div>
                </div>
              </div>
              <div className="col-4 col-md-3">
                <div className="card bg-dark border-secondary text-center">
                  <div className="card-body py-3">
                    <div className="fs-3 fw-bold text-warning">{avgScore}%</div>
                    <small className="text-secondary">Avg Match</small>
                  </div>
                </div>
              </div>
              <div className="col-4 col-md-3">
                <div className="card bg-dark border-secondary text-center">
                  <div className="card-body py-3">
                    <div className="fs-3 fw-bold text-success">{appliedCount}</div>
                    <small className="text-secondary">Applied</small>
                  </div>
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
            <JobTable jobs={jobs} onToggleApplied={toggleApplied} />
          </>
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
