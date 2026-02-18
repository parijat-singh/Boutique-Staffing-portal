import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

interface Job {
    id: number;
    title: string;
    location: string;
    salary_range: string;
    description: string;
    requirements: string;
    is_active: boolean;
    created_at: string;
}

const CandidateDashboard = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [jobsRes, appsRes] = await Promise.all([
                    client.get('/jobs/'),
                    client.get('/applications/me'),
                ]);
                setJobs(jobsRes.data);
                const ids = new Set<number>(appsRes.data.map((a: any) => a.job_id));
                setAppliedJobIds(ids);
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        (job.location && job.location.toLowerCase().includes(search.toLowerCase()))
    );

    if (loading) return (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <p style={{ marginTop: '0.5rem' }}>Loading positions...</p>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h1>Open Positions</h1>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Live v1.2.4</span>
                </div>
                <p className="subtitle">Browse and apply to available opportunities</p>
            </div>

            {/* Search bar */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                marginBottom: '1.25rem',
            }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by title or location..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: '2.25rem' }}
                    />
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.8125rem', padding: '0.25rem 0.75rem' }}>
                    {filteredJobs.length} result{filteredJobs.length !== 1 ? 's' : ''}
                </span>
            </div>

            {filteredJobs.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5" style={{ marginBottom: '0.75rem' }}>
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.9375rem' }}>
                        {search ? 'No jobs match your search.' : 'No open positions at the moment. Check back soon!'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filteredJobs.map(job => (
                        <div
                            key={job.id}
                            className="card card-clickable"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                            }}
                            onClick={() => navigate(`/jobs/${job.id}`)}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <h3 style={{ fontSize: '0.9375rem' }}>{job.title}</h3>
                                    {appliedJobIds.has(job.id) && (
                                        <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                                            ✓ Applied
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-light)' }}>
                                    {job.location && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                            {job.location}
                                        </span>
                                    )}
                                    {job.salary_range && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                                            {job.salary_range}
                                        </span>
                                    )}
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                        {new Date(job.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                {job.description && (
                                    <p style={{
                                        margin: '0.375rem 0 0 0', color: 'var(--text-muted)',
                                        fontSize: '0.8125rem', overflow: 'hidden',
                                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '550px',
                                    }}>
                                        {job.description}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={e => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}
                                className="btn btn-primary btn-sm"
                                style={{ whiteSpace: 'nowrap', marginLeft: '1rem' }}
                            >
                                {appliedJobIds.has(job.id) ? 'View Details' : 'View & Apply'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CandidateDashboard;
