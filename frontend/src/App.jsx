import React, { useState, useEffect } from 'react';
import { JobTable } from './components/JobTable';
import { SearchForm } from './components/SearchForm';
import { SearchProgress } from './components/SearchProgress';
import { Schedules } from './components/Schedules';
import { Login } from './components/Login';
import { api } from './api';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(api.isLoggedIn());
  const [username, setUsername] = useState(api.getUsername() || "");
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
      const data = await api.getJobs();
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
    api.logout();
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
      const result = await api.startSearch(profile);
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
      const updated = await api.updateJob(job.id, { applied: !job.applied });
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
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary sticky-top">
        <div className="container">
          <span className="navbar-brand fw-bold">
            🎯 JobHunter<span className="text-primary">.ai</span>
          </span>
          <div className="d-flex align-items-center gap-2">
            <div className="btn-group" role="group">
              <button
                className={`btn btn-sm ${view === 'jobs' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setView('jobs')}
              >
                📋 Dashboard {totalJobs > 0 && <span className="badge bg-light text-dark ms-1">{totalJobs}</span>}
              </button>

              {/* Persistent search tab */}
              {activeProfileId && (
                <button
                  className={`btn btn-sm ${view === 'progress'
                    ? (searchState === 'done' ? 'btn-success' : searchState === 'error' ? 'btn-danger' : 'btn-warning')
                    : (searchState === 'done' ? 'btn-outline-success' : searchState === 'error' ? 'btn-outline-danger' : 'btn-outline-warning')
                    }`}
                  onClick={() => setView('progress')}
                >
                  {searchState === 'running' && '🔄 Searching...'}
                  {searchState === 'done' && '✅ Searched'}
                  {searchState === 'error' && '❌ Error'}
                </button>
              )}

              <button
                className={`btn btn-sm ${view === 'schedules' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setView('schedules')}
              >
                ⏰ Schedules
              </button>

              <button
                className={`btn btn-sm ${view === 'new' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setView('new')}
              >
                ➕ New Search
              </button>
            </div>

            {/* User / Logout */}
            <div className="d-flex align-items-center gap-2 ms-3">
              <small className="text-secondary">👤 {username}</small>
              <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
                Logout
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
              <h5 className="mb-0 text-light">Job Results</h5>
              <button onClick={fetchJobs} className="btn btn-sm btn-outline-secondary">🔄 Refresh</button>
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
