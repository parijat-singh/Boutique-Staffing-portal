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
        <div className="animate-slide-up">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <button
                        onClick={() => navigate(`/jobs/${application.job.id}/applicants`)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                        &larr; Back to Applicants
                    </button>
                    <h1>AI Match Analysis</h1>
                    <p className="subtitle">
                        Candidate: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{application.user.first_name} {application.user.last_name}</span>
                        <br />
                        Job: <strong>{application.job.title}</strong>
                    </p>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="80" height="80" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--gray-100)" strokeWidth="10" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--secondary)" strokeWidth="10"
                                strokeDasharray={`${application.ai_score * 2.827} 282.7`}
                                strokeLinecap="round"
                                transform="rotate(-90 50 50)"
                            />
                        </svg>
                        <div style={{ position: 'absolute', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                            {application.ai_score}%
                        </div>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                        Overall Score
                    </div>
                </div>
            </div>

            {!analysis ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.3 }}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
                    <p>No detailed analysis available for this application.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '2rem' }}>

                    {/* Justification Card */}
                    <div className="card shadow-md" style={{ padding: '2rem', borderTop: '4px solid var(--secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Match Justification</h3>
                        </div>
                        <p style={{ lineHeight: 1.7, color: 'var(--gray-700)', fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
                            {analysis.justification}
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        {/* Gap Analysis List */}
                        <div className="card shadow-sm" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requirement Breakdown</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {analysis.gap_analysis.map((item, index) => (
                                    <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{item.requirement}</span>
                                            <span className={`badge ${item.status === 'Match' ? 'badge-success' :
                                                item.status === 'Weak' ? 'badge-warning' : 'badge-danger'
                                                }`} style={{ fontSize: '0.65rem' }}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <div style={{ width: '100%', height: '6px', background: 'var(--gray-100)', borderRadius: '3px', marginBottom: '0.5rem' }}>
                                            <div style={{
                                                width: item.status === 'Match' ? '100%' : item.status === 'Weak' ? '50%' : '15%',
                                                height: '100%',
                                                background: item.status === 'Match' ? 'var(--success)' : item.status === 'Weak' ? 'var(--warning)' : 'var(--danger)',
                                                borderRadius: '3px',
                                                transition: 'width 0.8s ease-out'
                                            }} />
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-light)', lineHeight: 1.4 }}>
                                            {item.note}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Summary Stats & AI Confidence */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="card shadow-sm" style={{ textAlign: 'center', padding: '2rem', background: 'linear-gradient(135deg, var(--primary) 0%, #1e4d7a 100%)', color: 'var(--white)' }}>
                                <div style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                                    {analysis.match_count}
                                </div>
                                <div style={{ opacity: 0.8, fontSize: '0.875rem' }}>Must-Haves Satisfied</div>
                                <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                                    Out of {analysis.total_must_haves} total requirements
                                </div>
                            </div>

                            <div className="card shadow-sm" style={{ padding: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem' }}>Next Steps Recommendation</h4>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                    <div style={{ padding: '0.5rem', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>
                                        {analysis.score > 80 ? "Highly recommended for immediate technical interview." :
                                            analysis.score > 60 ? "Consider for initial screening call to probe weak areas." :
                                                "Review portfolio deeply before proceeding due to requirement gaps."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationAnalysis;
