import client from './client';

export interface JobFilter {
    is_active?: boolean;
    owner_id?: number;
    search?: string;
}

const jobs = {
    getAll: async (filters: JobFilter = {}) => {
        const params = new URLSearchParams();
        if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));
        if (filters.owner_id) params.append('owner_id', String(filters.owner_id));
        if (filters.search) params.append('search', filters.search);

        const response = await client.get(`/jobs`, { params });
        return response.data;
    },

    toggleStatus: async (id: number, isActive: boolean) => {
        const response = await client.put(`/jobs/${id}`, { is_active: isActive });
        return response.data;
    }
};

export default jobs;
