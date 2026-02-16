import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';

interface ApplicantUser {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    years_of_experience?: number;
    linkedin_url?: string;
    city?: string;
    state?: string;
}

interface Applicant {
    id: number;
    status: string;
    created_at: string;
    user: ApplicantUser;
    ai_score?: number;
    reviewed?: boolean;
}

const JobApplicants = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState<'score' | 'date'>('score');
    const [filterReviewed, setFilterReviewed] = useState<'all' | 'reviewed' | 'unreviewed'>('all');

    useEffect(() => {
        const fetchApplicants = async () => {
            try {
                const response = await client.get(`/jobs/${id}/applications`);
                const data = response.data.map((a: any) => ({ ...a, reviewed: a.is_reviewed || false }));
                setApplicants(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load applicants or unauthorized.');
            } finally {
                setLoading(false);
            }
        };
        fetchApplicants();
    }, [id]);

    const toggleReviewed = async (appId: number) => {
        try {
            const res = await client.patch(`/applications/${appId}/reviewed`);
            setApplicants(prev => prev.map(a => a.id === appId ? { ...a, reviewed: res.data.is_reviewed } : a));
        } catch (err) {
            console.error('Failed to toggle reviewed', err);
        }
    };

    const sortedAndFiltered = applicants
        .filter(a => {
            if (filterReviewed === 'reviewed') return a.reviewed;
            if (filterReviewed === 'unreviewed') return !a.reviewed;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'score') return (b.ai_score || 0) - (a.ai_score || 0);
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

    if (loading) return (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
            Loading applicants...
        </div>
    );
    if (error) return <div className="alert alert-error" style={{ margin: '2rem' }}>{error}</div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        &larr; Back to Dashboard
                    </button>
                    <h1>Applicants Review</h1>
                    <p className="subtitle">Job ID #{id} &bull; {applicants.length} Total Applicants</p>
                </div>
            </div>

            {/* Controls */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-700)' }}>Sort by</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value as 'score' | 'date')} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--gray-300)' }}>
                        <option value="score">AI Score (High → Low)</option>
                        <option value="date">Date (Newest)</option>
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-700)' }}>Filter</label>
                    <select value={filterReviewed} onChange={e => setFilterReviewed(e.target.value as any)} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--gray-300)' }}>
                        <option value="all">All Statuses</option>
                        <option value="unreviewed">Unreviewed</option>
                        <option value="reviewed">Reviewed</option>
                    </select>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                    Showing <strong>{sortedAndFiltered.length}</strong> applicant{sortedAndFiltered.length !== 1 ? 's' : ''}
                </div>
            </div>

            {sortedAndFiltered.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
                    <p style={{ fontSize: '1.1rem' }}>No applicants found with current filters.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ margin: 0, width: '100%' }}>
                            <thead style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)' }}>Candidate</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)' }}>Match Score</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)' }}>Experience</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)' }}>Applied</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAndFiltered.map(app => (
                                    <tr key={app.id} style={{ borderBottom: '1px solid var(--gray-100)', background: app.reviewed ? 'var(--gray-50)' : 'white' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>
                                                {app.user?.first_name ? `${app.user.first_name} ${app.user.last_name || ''}` : 'Unknown'}
                                            </div>
                                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-light)' }}>{app.user?.email}</div>
                                            {app.user?.city && <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.125rem' }}>{app.user.city}, {app.user.state}</div>}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {app.ai_score !== undefined ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        minWidth: '2.5rem', padding: '0.25rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.875rem',
                                                        background: app.ai_score >= 80 ? 'var(--success-bg)' : app.ai_score >= 50 ? 'var(--warning-bg)' : 'var(--danger-bg)',
                                                        color: app.ai_score >= 80 ? 'var(--success)' : app.ai_score >= 50 ? 'var(--warning)' : 'var(--danger)',
                                                        border: `1px solid ${app.ai_score >= 80 ? 'var(--success-border)' : app.ai_score >= 50 ? 'var(--warning-border)' : 'var(--danger-border)'}`
                                                    }}>
                                                        {app.ai_score}%
                                                    </span>
                                                </div>
                                            ) : <span style={{ color: 'var(--text-light)' }}>—</span>}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                            {app.user?.years_of_experience != null ? `${app.user.years_of_experience} yrs` : '—'}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                            {new Date(app.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                {app.user?.linkedin_url && (
                                                    <a href={app.user.linkedin_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" title="View LinkedIn">
                                                        in
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => toggleReviewed(app.id)}
                                                    className={`btn btn-sm ${app.reviewed ? 'btn-secondary' : 'btn-primary'}`}
                                                    style={{ minWidth: '80px' }}
                                                >
                                                    {app.reviewed ? 'Reviewed' : 'Review'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobApplicants;
