import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

interface Job {
    id: number;
    title: string;
    location: string;
}

interface Application {
    id: number;
    job_id: number;
    status: string;
    created_at: string;
    job: Job;
}

const MyApplications = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const response = await client.get('/applications/me');
                const latestByJob = new Map<number, Application>();
                for (const app of response.data) {
                    const existing = latestByJob.get(app.job_id);
                    if (!existing || new Date(app.created_at) > new Date(existing.created_at)) {
                        latestByJob.set(app.job_id, app);
                    }
                }
                setApplications(Array.from(latestByJob.values()));
            } catch (error) {
                console.error('Failed to fetch applications', error);
            } finally {
                setLoading(false);
            }
        };
        fetchApplications();
    }, []);

    if (loading) return (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <p style={{ marginTop: '0.5rem' }}>Loading applications...</p>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>My Applications</h1>
                    <p className="subtitle">Track your status and history</p>
                </div>
            </div>

            {applications.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%', background: 'var(--gray-100)',
                        margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--gray-400)'
                    }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    </div>
                    <h3 style={{ marginBottom: '0.5rem' }}>No applications yet</h3>
                    <p style={{ color: 'var(--text-light)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                        You haven't applied to any positions. Browse our open jobs to find your next opportunity.
                    </p>
                    <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                        Browse Open Jobs
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {applications.map(app => (
                        <div
                            key={app.id}
                            className="card card-clickable"
                            style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                cursor: 'pointer',
                            }}
                            onClick={() => navigate(`/jobs/${app.job.id}`)}
                        >
                            <div>
                                <h3 style={{ fontSize: '1rem', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                                    {app.job?.title || 'Unknown Job'}
                                </h3>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                    {app.job?.location && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                            {app.job.location}
                                        </span>
                                    )}
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                        Applied {new Date(app.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <span className={`badge ${app.status === 'APPLIED' ? 'badge-info' : app.status === 'REJECTED' ? 'badge-danger' : 'badge-success'}`}>
                                {app.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyApplications;
