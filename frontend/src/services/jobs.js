import { ApiClient } from "../lib/client";

export const JobService = {
    getAll(applied = null) {
        let url = "/jobs/";
        if (applied !== null) {
            url += `?applied=${applied}`;
        }
        return ApiClient.get(url);
    },

    update(jobId, updates) {
        return ApiClient.patch(`/jobs/${jobId}`, updates);
    }
};
