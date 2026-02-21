import { useState, useEffect, useRef, useCallback } from 'react';
import { JobService } from '../services/jobs';
import { SearchService } from '../services/search';

export function useJobs(logout) {
  const [jobs, setJobs] = useState([]);
  const [searchProfiles, setSearchProfiles] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Pagination & metrics state
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    pageSize: 20,
    total_applied: 0,
    avg_score: 0
  });

  // Global filters driving the API fetch
  const [filters, setFilters] = useState({
    search_profile_id: "",
    min_score: "",
    max_distance: "",
    worth_applying: "",
    sort_by: "created_at",
    sort_order: "desc"
  });

  // Refs needed for stable intervals and event listeners
  const filtersRef = useRef(filters);
  const paginationRef = useRef(pagination);

  // Sync refs with reactive state
  useEffect(() => {
    filtersRef.current = filters;
    paginationRef.current = pagination;
  }, [filters, pagination]);

  const fetchJobs = useCallback(async (isPolling = false) => {
    try {
      const currentFilters = isPolling ? filtersRef.current : filters;
      const currentPage = isPolling ? paginationRef.current.page : pagination.page;
      const res = await JobService.getAll({
        ...currentFilters,
        page: currentPage,
        page_size: paginationRef.current.pageSize
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
      if (error.message === "UNAUTHORIZED" && logout) {
        logout();
        return;
      }
      console.error("Fetch jobs error:", error);
    } finally {
        if (!isPolling) setIsInitialLoad(false);
    }
  }, [filters, logout, pagination.page]);

  // Initial load & dependency reaction
  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  // Load search profiles once
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

  // Background polling intervals
  useEffect(() => {
    const interval = setInterval(() => {
      fetchJobs(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  // Visibility change handler for fresh data when tab is focused
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchJobs(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchJobs]);

  const toggleApplied = async (job) => {
    try {
      const updated = await JobService.toggleApplied(job.id, !job.applied);
      setJobs(prev => prev.map(j => j.id === job.id ? updated : j));
    } catch (error) {
      if (error.message === "UNAUTHORIZED" && logout) { logout(); return; }
      console.error("Failed to update job", error);
    }
  };

  const clearFilters = () => {
    setFilters({
      search_profile_id: "",
      min_score: "",
      max_distance: "",
      worth_applying: "",
      sort_by: "created_at",
      sort_order: "desc"
    });
  };

  return {
    jobs,
    pagination,
    setPagination,
    filters,
    setFilters,
    searchProfiles,
    fetchJobs,
    toggleApplied,
    clearFilters,
    isInitialLoad
  };
}
