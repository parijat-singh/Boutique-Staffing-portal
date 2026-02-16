import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';

interface GapItem {
    requirement: string;
    status: 'Missing' | 'Weak' | 'Match';
    note: string;
}

interface AIAnalysis {
    match_count: number;
    total_must_haves: number;
    score: number;
    justification: string;
    gap_analysis: GapItem[];
}

interface ApplicationDetails {
    id: number;
    user: {
        first_name: string;
        last_name: string;
        email: string;
    };
    job: {
        title: string;
        id: number;
    };
    ai_score: number;
    ai_analysis_json?: AIAnalysis;
}

const ApplicationAnalysis = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [application, setApplication] = useState<ApplicationDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchApplication = async () => {
            try {
                const response = await client.get(`/applications/${id}`);
                setApplication(response.data);
            } catch (err) {
                console.error(err);
                setError('Failed to load application details.');
            } finally {
                setLoading(false);
            }
        };
        fetchApplication();
    }, [id]);

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>Loading analysis...</div>;
    if (error) return <div className="alert alert-error" style={{ margin: '2rem' }}>{error}</div>;
    if (!application) return <div style={{ padding: '3rem', textAlign: 'center' }}>Application not found</div>;

    const analysis = application.ai_analysis_json;

    return (
        <div>
            <div className="page-header">
                <div>
                    <button
                        onClick={() => navigate(`/jobs/${application.job.id}/applicants`)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                        &larr; Back to Applicants
                    </button>
                    <h1>AI Match Analysis</h1>
                    <p className="subtitle">
                        {application.user.first_name} {application.user.last_name} for <strong>{application.job.title}</strong>
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                        {application.ai_score}%
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Match Score
                    </div>
                </div>
            </div>

            {!analysis ? (
                <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                    No detailed analysis available for this application.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr' }}>

                    {/* Key Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--gray-900)' }}>
                                {analysis.match_count} / {analysis.total_must_haves}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Must-Haves Met</div>
                        </div>
                        {/* We could add more stats here if available */}
                    </div>

                    {/* Justification */}
                    <div className="card">
                        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--gray-100)', paddingBottom: '0.75rem' }}>Match Justification</h3>
                        <p style={{ lineHeight: 1.6, color: 'var(--gray-700)' }}>
                            {analysis.justification}
                        </p>
                    </div>

                    {/* Gap Analysis */}
                    <div className="card">
                        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--gray-100)', paddingBottom: '0.75rem' }}>Gap Analysis</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {analysis.gap_analysis.map((item, index) => (
                                <div key={index} style={{
                                    padding: '1rem',
                                    background: 'var(--gray-50)',
                                    borderRadius: '6px',
                                    borderLeft: `4px solid ${item.status === 'Match' ? 'var(--success)' :
                                            item.status === 'Weak' ? 'var(--warning)' : 'var(--danger)'
                                        }`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--gray-900)' }}>{item.requirement}</h4>
                                        <span className={`badge ${item.status === 'Match' ? 'badge-success' :
                                                item.status === 'Weak' ? 'badge-warning' : 'badge-danger'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                        {item.note}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationAnalysis;
