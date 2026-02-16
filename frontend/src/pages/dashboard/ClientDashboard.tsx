import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

interface Job {
    id: number;
    title: string;
    location: string;
    is_active: boolean;
}

const ClientDashboard = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<Job[]>([]);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await client.get('/jobs/');
                setJobs(response.data);
            } catch (error) {
                console.error('Failed to fetch jobs', error);
            }
        };
        fetchJobs();
    }, []);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>My Job Postings</h1>
                    <p className="subtitle">Manage your positions and review applicants</p>
                </div>
                <button onClick={() => navigate('/jobs/new')} className="btn btn-primary" style={{ gap: '0.375rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Post New Job
                </button>
            </div>

            {jobs.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5" style={{ marginBottom: '0.75rem' }}>
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                    </svg>
                    <p style={{ color: 'var(--text-light)', margin: 0 }}>No jobs posted yet. Create your first posting!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {jobs.map(job => (
                        <div
                            key={job.id}
                            className="card"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <h3 style={{ fontSize: '0.9375rem', marginBottom: '0.125rem' }}>{job.title}</h3>
                                <span style={{ fontSize: '0.8125rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                    {job.location || 'Remote'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span className={`badge ${job.is_active ? 'badge-success' : 'badge-danger'}`}>
                                    {job.is_active ? 'Active' : 'Closed'}
                                </span>
                                <button onClick={() => navigate(`/jobs/${job.id}/edit`)} className="btn btn-secondary btn-sm">
                                    Edit
                                </button>
                                <button onClick={() => navigate(`/jobs/${job.id}/applicants`)} className="btn btn-primary btn-sm">
                                    Applicants
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientDashboard;
