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
    work_permit_type?: string;
}

interface Applicant {
    id: number;
    status: string;
    created_at: string;
    user: ApplicantUser;
    ai_score?: number;
    reviewed?: boolean;
    resume_path?: string;
}

const getResumeUrl = (path: string | undefined) => {
    if (!path) return '#';
    // path is stored as "uploads/filename"
    // Backend mount is at "/uploads"
    // Ideally use env var, but fallback to relative or localhost
    const baseUrl = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
        : 'http://localhost:8000';
    return `${baseUrl}/${path}`;
};

const MultiSelectDropdown = ({ options, selected, onChange, placeholder }: { options: string[], selected: string[], onChange: (val: string[]) => void, placeholder: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter(s => s !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            {isOpen && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9 }}
                    onClick={() => setIsOpen(false)}
                />
            )}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '0.4rem',
                    borderRadius: '4px',
                    border: '1px solid var(--gray-300)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    background: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    minHeight: '38px',
                    userSelect: 'none'
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected.length > 0 ? `${selected.length} selected` : <span style={{ color: 'var(--gray-400)' }}>{placeholder}</span>}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginLeft: '8px' }}>▼</span>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    background: 'white',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '4px',
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    {options.map(option => (
                        <div
                            key={option}
                            onClick={() => toggleOption(option)}
                            style={{
                                padding: '0.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                borderBottom: '1px solid var(--gray-100)',
                                background: selected.includes(option) ? 'var(--gray-50)' : 'white',
                                transition: 'background 0.2s'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(option)}
                                readOnly
                                style={{ pointerEvents: 'none', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.875rem' }}>{option}</span>
                        </div>
                    ))}
                    {options.length === 0 && (
                        <div style={{ padding: '0.5rem', color: 'var(--text-light)', fontSize: '0.875rem', textAlign: 'center' }}>
                            No options available
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const JobApplicants = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState<'score' | 'date'>('score');
    const [filterReviewed, setFilterReviewed] = useState<'all' | 'reviewed' | 'unreviewed'>('all');

    // New Filter States
    const [nameSearch, setNameSearch] = useState('');
    const [minScore, setMinScore] = useState<number | ''>('');
    const [minExp, setMinExp] = useState<number | ''>('');
    const [workPermit, setWorkPermit] = useState<string[]>([]);
    const [locationState, setLocationState] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

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

    // Derived options for dropdowns
    const uniqueWorkPermits = Array.from(new Set(applicants.map(a => a.user?.work_permit_type).filter(Boolean))) as string[];
    const uniqueStates = Array.from(new Set(applicants.map(a => a.user?.state).filter(Boolean))) as string[];

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
            // Reviewed Filter
            if (filterReviewed === 'reviewed' && !a.reviewed) return false;
            if (filterReviewed === 'unreviewed' && a.reviewed) return false;

            // Name/Email Search
            if (nameSearch) {
                const searchLower = nameSearch.toLowerCase();
                const fullName = `${a.user?.first_name || ''} ${a.user?.last_name || ''}`.toLowerCase();
                const email = (a.user?.email || '').toLowerCase();
                if (!fullName.includes(searchLower) && !email.includes(searchLower)) return false;
            }

            // Min Score
            if (minScore !== '' && (a.ai_score || 0) < Number(minScore)) return false;

            // Min Experience
            if (minExp !== '' && (a.user?.years_of_experience || 0) < Number(minExp)) return false;

            // Work Permit
            if (workPermit.length > 0) {
                if (!a.user?.work_permit_type || !workPermit.includes(a.user.work_permit_type)) return false;
            }

            // Location State
            if (locationState.length > 0) {
                if (!a.user?.state || !locationState.includes(a.user.state)) return false;
            }

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
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: showFilters ? '1rem' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-700)' }}>Sort by</label>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'score' | 'date')} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--gray-300)' }}>
                            <option value="score">AI Score (High → Low)</option>
                            <option value="date">Date (Newest)</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-700)' }}>Status</label>
                        <select value={filterReviewed} onChange={e => setFilterReviewed(e.target.value as any)} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--gray-300)' }}>
                            <option value="all">All</option>
                            <option value="unreviewed">Unreviewed</option>
                            <option value="reviewed">Reviewed</option>
                        </select>
                    </div>

                    <div style={{ flex: 1 }} />

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <span>filters</span>
                        <span style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                    </button>

                    <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', minWidth: '80px', textAlign: 'right' }}>
                        <strong>{sortedAndFiltered.length}</strong> matches
                    </div>
                </div>

                {showFilters && (
                    <div style={{
                        borderTop: '1px solid var(--gray-200)',
                        paddingTop: '1rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '1rem'
                    }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Name/Email</label>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={nameSearch}
                                onChange={e => setNameSearch(e.target.value)}
                                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--gray-300)', fontSize: '0.875rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Min Score (%)</label>
                            <input
                                type="number"
                                placeholder="e.g. 70"
                                value={minScore}
                                onChange={e => setMinScore(e.target.value === '' ? '' : Number(e.target.value))}
                                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--gray-300)', fontSize: '0.875rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Min Experience (Yrs)</label>
                            <input
                                type="number"
                                placeholder="e.g. 3"
                                value={minExp}
                                onChange={e => setMinExp(e.target.value === '' ? '' : Number(e.target.value))}
                                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--gray-300)', fontSize: '0.875rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Work Permit</label>
                            <MultiSelectDropdown
                                options={uniqueWorkPermits}
                                selected={workPermit}
                                onChange={setWorkPermit}
                                placeholder="Select permit..."
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.25rem' }}>State</label>
                            <MultiSelectDropdown
                                options={uniqueStates}
                                selected={locationState}
                                onChange={setLocationState}
                                placeholder="Select state..."
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setNameSearch('');
                                    setMinScore('');
                                    setMinExp('');
                                    setWorkPermit([]);
                                    setLocationState([]);
                                    setFilterReviewed('all');
                                }}
                                style={{ fontSize: '0.875rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}
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
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)' }}>Work Permit</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)' }}>State</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)' }}>Applied</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAndFiltered.map(app => (
                                    <tr key={app.id} style={{ borderBottom: '1px solid var(--gray-100)', background: app.reviewed ? 'var(--gray-50)' : 'white' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div title={`Phone: ${app.user?.phone_number || 'N/A'}`} style={{ fontWeight: 600, color: 'var(--gray-900)' }}>
                                                {app.resume_path ? (
                                                    <a
                                                        href={getResumeUrl(app.resume_path)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ color: 'inherit', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                                                    >
                                                        {app.user?.first_name ? `${app.user.first_name} ${app.user.last_name || ''}` : 'Unknown'}
                                                    </a>
                                                ) : (
                                                    <span style={{ cursor: 'help', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
                                                        {app.user?.first_name ? `${app.user.first_name} ${app.user.last_name || ''}` : 'Unknown'}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.8125rem', marginTop: '0.125rem' }}>
                                                <a href={`mailto:${app.user?.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                                                    {app.user?.email}
                                                </a>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {app.ai_score !== undefined ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <a href={`/applications/${app.id}/analysis`} style={{ textDecoration: 'none' }}>
                                                        <span style={{
                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                            minWidth: '2.5rem', padding: '0.25rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.875rem',
                                                            background: app.ai_score >= 80 ? 'var(--success-bg)' : app.ai_score >= 50 ? 'var(--warning-bg)' : 'var(--danger-bg)',
                                                            color: app.ai_score >= 80 ? 'var(--success)' : app.ai_score >= 50 ? 'var(--warning)' : 'var(--danger)',
                                                            border: `1px solid ${app.ai_score >= 80 ? 'var(--success-border)' : app.ai_score >= 50 ? 'var(--warning-border)' : 'var(--danger-border)'}`,
                                                            cursor: 'pointer'
                                                        }}>
                                                            {app.ai_score}%
                                                        </span>
                                                    </a>
                                                </div>
                                            ) : <span style={{ color: 'var(--text-light)' }}>—</span>}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                            {app.user?.years_of_experience != null ? `${app.user.years_of_experience} yrs` : '—'}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                            {app.user?.work_permit_type || '—'}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                            {app.user?.state || '—'}
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
