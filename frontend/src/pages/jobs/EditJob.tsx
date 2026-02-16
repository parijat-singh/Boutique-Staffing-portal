import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import client from '../../api/client';

const EditJob = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [requirements, setRequirements] = useState('');
    const [niceToHave, setNiceToHave] = useState('');
    const [location, setLocation] = useState('');
    const [salaryRange, setSalaryRange] = useState('');
    const [isActive, setIsActive] = useState(true);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await client.get(`/jobs/${id}`);
                const job = response.data;
                setTitle(job.title || '');
                setDescription(job.description || '');
                setRequirements(job.requirements || '');
                setNiceToHave(job.nice_to_have_requirements || '');
                setLocation(job.location || '');
                setSalaryRange(job.salary_range || '');
                setIsActive(job.is_active);
            } catch (err) {
                console.error(err);
                setError('Failed to load job details.');
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            await client.put(`/jobs/${id}`, {
                title,
                description,
                requirements,
                nice_to_have_requirements: niceToHave,
                location,
                salary_range: salaryRange,
                is_active: isActive,
            });
            setSuccess('Job updated successfully!');
            setTimeout(() => navigate('/dashboard'), 1000);
        } catch (err) {
            console.error(err);
            setError('Failed to update job.');
            setSaving(false);
        }
    };

    if (loading) return (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
            Loading job...
        </div>
    );

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
                <div style={{ borderBottom: '1px solid var(--gray-200)', paddingBottom: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Edit Job Posting</h1>
                        <p style={{ color: 'var(--text-light)', margin: 0 }}>Update job details and status.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--gray-50)', padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid var(--gray-200)' }}>
                        <input
                            type="checkbox"
                            className="toggle"
                            checked={isActive}
                            onChange={e => setIsActive(e.target.checked)}
                            style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: isActive ? 'var(--success)' : 'var(--text-light)' }}>
                            {isActive ? 'Active' : 'Draft / Closed'}
                        </span>
                    </div>
                </div>

                {success && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{success}</div>}
                {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}>Job Title *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Location *</label>
                            <input value={location} onChange={e => setLocation(e.target.value)} required style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Salary Range *</label>
                            <input value={salaryRange} onChange={e => setSalaryRange(e.target.value)} required style={inputStyle} />
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Description *</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} required style={areaStyle} />
                    </div>

                    <div>
                        <label style={labelStyle}>Key Requirements *</label>
                        <textarea value={requirements} onChange={e => setRequirements(e.target.value)} required style={areaStyle} />
                    </div>

                    <div>
                        <label style={labelStyle}>Nice-to-Have</label>
                        <textarea value={niceToHave} onChange={e => setNiceToHave(e.target.value)} style={{ ...areaStyle, minHeight: '80px' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-100)' }}>
                        <button type="submit" disabled={saving} className="btn btn-primary" style={{ minWidth: '120px' }}>
                            {saving ? 'Saving...' : 'Save Changes'}
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

export default EditJob;
