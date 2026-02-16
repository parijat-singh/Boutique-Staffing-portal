import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

const CreateJob = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [requirements, setRequirements] = useState('');
    const [niceToHave, setNiceToHave] = useState('');
    const [location, setLocation] = useState('');
    const [salaryRange, setSalaryRange] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await client.post('/jobs/', {
                title,
                description,
                requirements,
                nice_to_have_requirements: niceToHave,
                location,
                salary_range: salaryRange
            });
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError('Failed to create job posting. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const labelStyle = { display: 'block', marginBottom: '0.375rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-800)' };
    const inputStyle = { width: '100%', padding: '0.625rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-300)', fontSize: '0.9375rem' };
    const areaStyle = { ...inputStyle, minHeight: '120px', fontFamily: 'inherit' };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                Back
            </button>
            <div className="card">
                <div style={{ borderBottom: '1px solid var(--gray-200)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Post a New Job</h1>
                    <p style={{ color: 'var(--text-light)', margin: 0 }}>Create a new opportunity for candidates.</p>
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}>Job Title *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle} placeholder="e.g. Senior Software Engineer" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Location *</label>
                            <input value={location} onChange={e => setLocation(e.target.value)} required style={inputStyle} placeholder="e.g. Remote / New York, NY" />
                        </div>
                        <div>
                            <label style={labelStyle}>Salary Range *</label>
                            <input value={salaryRange} onChange={e => setSalaryRange(e.target.value)} required style={inputStyle} placeholder="e.g. $120k - $150k" />
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Description *</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} required style={areaStyle} placeholder="Detailed overview of the role..." />
                    </div>

                    <div>
                        <label style={labelStyle}>Key Requirements *</label>
                        <textarea value={requirements} onChange={e => setRequirements(e.target.value)} required style={areaStyle} placeholder="- Must have X years of experience..." />
                    </div>

                    <div>
                        <label style={labelStyle}>Nice-to-Have (Optional)</label>
                        <textarea value={niceToHave} onChange={e => setNiceToHave(e.target.value)} style={{ ...areaStyle, minHeight: '80px' }} placeholder="- Bonus points for..." />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-100)' }}>
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ minWidth: '120px' }}>
                            {loading ? 'Posting...' : 'Post Job'}
                        </button>
                        <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-secondary">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateJob;
