import { ApiClient } from "../lib/client";

export const JobService = {
    /**
     * Fetch jobs with optional filters and sorting.
     * @param {Object} filters
     * @param {number}  [filters.min_score]
     * @param {number}  [filters.max_score]
     * @param {number}  [filters.min_distance]
     * @param {number}  [filters.max_distance]
     * @param {boolean} [filters.worth_applying]
     * @param {boolean} [filters.applied]
     * @param {string}  [filters.sort_by]      - created_at | affinity_score | distance_km | title
     * @param {string}  [filters.sort_order]   - asc | desc
     */
    async getAll(filters = {}) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(filters)) {
            if (value !== null && value !== undefined && value !== "") {
                params.append(key, String(value));
            }
        }
        const qs = params.toString();
        const url = qs ? `/jobs/?${qs}` : "/jobs/";
        const res = await ApiClient.get(url);
        return res.data;
    },

    async toggleApplied(jobId, applied) {
        const res = await ApiClient.patch(`/jobs/${jobId}`, { applied });
        return res.data;
    },
};
