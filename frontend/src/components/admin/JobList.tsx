import { useState, useEffect } from 'react';
import jobs from '../../api/jobs';
import type { JobFilter } from '../../api/jobs';
import client from '../../api/client';

interface User {
    id: number;
    email: string;
    role: string;
    first_name?: string;
    company_name?: string;
}

interface Job {
    id: number;
    title: string;
    company: string;
    location: string;
    job_type: string;
    created_at: string;
    is_active: boolean;
    owner?: User;
    description: string;
}

const JobList = () => {
    const [jobList, setJobList] = useState<Job[]>([]);
    const [clients, setClients] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [clientFilter, setClientFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchClients();
        fetchJobs();
    }, []);

    useEffect(() => {
        const newFilters: JobFilter = {};
        if (statusFilter !== 'all') newFilters.is_active = statusFilter === 'active';
        if (clientFilter !== 'all') newFilters.owner_id = parseInt(clientFilter);
        if (searchTerm) newFilters.search = searchTerm;

        // Debounce search? For now simple effect
        const timeoutId = setTimeout(() => {
            fetchJobs(newFilters);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [statusFilter, clientFilter, searchTerm]);

    const fetchClients = async () => {
        try {
            const response = await client.get('/admin/users');
            // Filter only clients
            const clientUsers = response.data.filter((u: User) => u.role === 'client');
            setClients(clientUsers);
        } catch (err) {
            console.error('Failed to fetch clients', err);
        }
    };

    const fetchJobs = async (currentFilters: JobFilter = {}) => {
        setLoading(true);
        try {
            const data = await jobs.getAll(currentFilters);
            setJobList(data);
        } catch (err) {
            console.error('Failed to fetch jobs', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleJobStatus = async (id: number, currentStatus: boolean) => {
        try {
            // Optimistic update
            setJobList(prev => prev.map(job => job.id === id ? { ...job, is_active: !currentStatus } : job));
            await jobs.toggleStatus(id, !currentStatus);
        } catch (err) {
            console.error('Failed to update job status', err);
            // Revert on error would be ideal, but simple alert for now
            alert('Failed to update status');
            // Re-fetch with current derived filters would be best, but complex here without extracting the filter logic.
            // For now, just fetch all to be safe or leave as is.
            fetchJobs();
        }
    };

    return (
        <div className="card" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0 }}>Posted Jobs</h3>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search jobs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-300)' }}
                    />

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-300)' }}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    {/* Client Filter */}
                    <select
                        value={clientFilter}
                        onChange={(e) => setClientFilter(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-300)', maxWidth: '200px' }}
                    >
                        <option value="all">All Clients</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>
                                {client.company_name || client.email}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
                    Loading jobs...
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)', textAlign: 'left' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>Job Title</th>
                                <th style={{ padding: '1rem' }}>Client</th>
                                <th style={{ padding: '1rem' }}>Location</th>
                                <th style={{ padding: '1rem' }}>Posted</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobList.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                                        No jobs found matching filters.
                                    </td>
                                </tr>
                            ) : (
                                jobList.map(job => (
                                    <tr key={job.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{job.title}</div>
                                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-light)' }}>
                                                {job.job_type} • {job.id}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {job.owner ? (
                                                <>
                                                    <div style={{ fontWeight: 500 }}>{job.owner.company_name || '—'}</div>
                                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-light)' }}>{job.owner.email}</div>
                                                </>
                                            ) : (
                                                <span style={{ color: 'var(--text-light)' }}>Unknown Client</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                            {job.location || '—'}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                            {new Date(job.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span className={`badge ${job.is_active ? 'badge-success' : 'badge-secondary'}`}>
                                                {job.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => toggleJobStatus(job.id, job.is_active)}
                                                className={`btn btn-sm ${job.is_active ? 'btn-danger' : 'btn-success'}`}
                                                style={{ fontSize: '0.75rem' }}
                                            >
                                                {job.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default JobList;
