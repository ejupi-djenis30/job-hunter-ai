import React, { useState, useEffect, useRef } from 'react';
import { JobService } from '../services/jobs';
import { useAuth } from '../context/AuthContext';
import { JobTable } from '../components/JobTable';
import { FilterBar } from '../components/FilterBar';
import { SearchService } from '../services/search';

export function JobsPage() {
  const { logout } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [searchProfiles, setSearchProfiles] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    pageSize: 20,
    total_applied: 0,
    avg_score: 0
  });

  const [filters, setFilters] = useState({
    search_profile_id: "",
    min_score: "",
    max_distance: "",
    worth_applying: "",
    sort_by: "created_at",
    sort_order: "desc"
  });

  const filtersRef = useRef(filters);
  const paginationRef = useRef(pagination);

  const fetchJobs = async (isPolling = false) => {
    try {
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
        logout();
        return;
      }
      console.error("Fetch jobs error:", error);
    }
  };

  useEffect(() => {
    filtersRef.current = filters;
    paginationRef.current = pagination;
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await SearchService.getProfiles();
        setSearchProfiles(res || []);
      } catch (err) {
        console.error("Failed to load search profiles", err);
      }
    };
    fetchProfiles();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchJobs(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchJobs(true);
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleApplied = async (job) => {
    try {
      const updated = await JobService.toggleApplied(job.id, !job.applied);
      setJobs(prev => prev.map(j => j.id === job.id ? updated : j));
    } catch (error) {
      if (error.message === "UNAUTHORIZED") { logout(); return; }
      console.error("Failed to update job", error);
    }
  };

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
    <div className="animate-slide-up">
      <div className="row g-3 g-md-4 mb-4 mb-md-5">
        <div className="col-12 col-md-4">
          <StatCard label="Jobs Found" value={totalJobs} color="primary" icon="bi-briefcase-fill" />
        </div>
        <div className="col-6 col-md-4">
          <StatCard label="Avg Match" value={`${avgScore}%`} color="warning" icon="bi-pie-chart-fill" />
        </div>
        <div className="col-6 col-md-4">
          <StatCard label="Applied" value={appliedCount} color="success" icon="bi-send-check-fill" />
        </div>
      </div>

      <div className="glass-panel overflow-hidden d-flex flex-column">
        <div className="p-3 border-bottom border-white-10 bg-black-20 transition-all">
            <FilterBar
            filters={filters}
            onChange={setFilters}
            searchProfiles={searchProfiles}
            onRefresh={() => fetchJobs()}
            onClear={() => setFilters({
                search_profile_id: "",
                min_score: "",
                max_distance: "",
                worth_applying: "",
                sort_by: "created_at",
                sort_order: "desc"
            })}
            />
        </div>
        <JobTable
            jobs={jobs}
            isGlobalView={!filters.search_profile_id}
            onToggleApplied={toggleApplied}
            pagination={pagination}
            onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
        />
      </div>
    </div>
  );
}
