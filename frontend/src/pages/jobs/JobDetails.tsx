import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface Job {
    id: number;
    title: string;
    description: string;
    requirements: string;
    nice_to_have_requirements?: string;
    location: string;
    salary_range: string;
    is_active: boolean;
    created_at: string;
}

const JobDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth()!;
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [applyError, setApplyError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
    const [resume, setResume] = useState<File | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Profile Pre-fill
    const [formData, setFormData] = useState({
        firstName: '', middleInitial: '', lastName: '',
        phone: '', email: '', confirmEmail: '',
        yearsExp: '', workPermit: '', city: '', state: '', linkedinUrl: ''
    });

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await client.get(`/jobs/${id}`);
                setJob(response.data);
            } catch (err) {
                console.error(err);
                setError('Job not found or access denied.');
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [id]);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.first_name || '',
                middleInitial: user.middle_initial || '',
                lastName: user.last_name || '',
                phone: user.phone_number || '',
                email: user.email || '',
                confirmEmail: user.email || '',
                yearsExp: user.years_of_experience != null ? String(user.years_of_experience) : '',
                workPermit: user.work_permit_type || '',
                city: user.city || '',
                state: user.state || '',
                linkedinUrl: user.linkedin_url || ''
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.firstName.trim()) errors.firstName = 'Required';
        if (!formData.lastName.trim()) errors.lastName = 'Required';
        if (!formData.phone.trim()) errors.phone = 'Required';
        if (!formData.email.trim()) errors.email = 'Required';
        if (formData.email !== formData.confirmEmail) errors.confirmEmail = 'Emails do not match';
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const submitApplication = async (forceUpdate: boolean) => {
        if (!validateForm()) return;

        if (!resume) {
            setApplyError('Please upload your resume (PDF or DOCX).');
            return;
        }
        if (resume.size > 10 * 1024 * 1024) {
            setApplyError('File size must be under 10MB.');
            return;
        }
        if (!resume.name.toLowerCase().endsWith('.pdf') && !resume.name.toLowerCase().endsWith('.docx')) {
            setApplyError('Only PDF and DOCX files are accepted.');
            return;
        }

        setApplyError('');
        setSuccessMessage('');
        setShowOverwriteConfirm(false);

        // Background update profile
        client.put('/users/me', {
            first_name: formData.firstName || null,
            middle_initial: formData.middleInitial || null,
            last_name: formData.lastName || null,
            phone_number: formData.phone || null,
            city: formData.city || null,
            state: formData.state || null,
            years_of_experience: formData.yearsExp ? parseInt(formData.yearsExp) : null,
            work_permit_type: formData.workPermit || null,
            linkedin_url: formData.linkedinUrl || null,
        }).catch(err => console.error('Profile update failed', err));

        const payload = new FormData();
        payload.append('job_id', id || '');
        payload.append('resume', resume);
        if (forceUpdate) payload.append('force_update', 'true');

        try {
            await client.post('/applications/', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSuccessMessage('Successfully applied!');
        } catch (err: any) {
            if (err.response?.status === 409) {
                setShowOverwriteConfirm(true);
            } else {
                setApplyError(err.response?.data?.detail || 'Application failed.');
            }
        }
    };

    if (loading) return (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <p style={{ marginTop: '0.5rem' }}>Loading opportunity...</p>
        </div>
    );

    if (error || !job) return (
        <div className="alert alert-error" style={{ margin: '2rem' }}>
            {error || 'Job not found'}
            <div style={{ marginTop: '1rem' }}><button onClick={() => navigate('/dashboard')} className="btn btn-secondary">Back to Dashboard</button></div>
        </div>
    );


    const controlStyle: React.CSSProperties = { width: '100%', padding: '0.625rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)', fontSize: '0.9375rem' };
    const errorStyle: React.CSSProperties = { ...controlStyle, borderColor: 'var(--danger)', background: '#fef2f2' };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                Back
            </button>

            <div className="card" style={{ marginBottom: '2rem', padding: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', lineHeight: 1.2 }}>{job.title}</h1>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--text-light)', fontSize: '0.9375rem', marginBottom: '2rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        {job.location}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                        {job.salary_range}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        Posted {new Date(job.created_at).toLocaleDateString()}
                    </span>
                </div>

                <div style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>Description</h3>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--gray-700)' }}>{job.description}</div>
                </div>

                <div style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>Requirements</h3>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--gray-700)' }}>{job.requirements}</div>
                </div>

                {job.nice_to_have_requirements && (
                    <div style={{ marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>Nice to Have</h3>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--gray-700)' }}>{job.nice_to_have_requirements}</div>
                    </div>
                )}
            </div>

            {user?.role === 'candidate' && (
                <div className="card" style={{ padding: '2.5rem', background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Apply for Position</h2>
                    <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>Complete your profile and attach your resume.</p>

                    {successMessage ? (
                        <div className="animate-slide-up" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'var(--success-bg)', color: 'var(--success)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1.5rem', border: '4px solid var(--white)',
                                boxShadow: 'var(--shadow-md)'
                            }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Application Submitted!</h2>
                            <p style={{ color: 'var(--text-light)', maxWidth: '400px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
                                Thank you for your interest in the <strong>{job.title}</strong> position. Our team will review your profile and get back to you soon.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                                    Browse More Jobs
                                </button>
                                <button onClick={() => navigate('/applications')} className="btn btn-secondary">
                                    View My Applications
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {applyError && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{applyError}</div>}
                            {showOverwriteConfirm ? (
                                <div className="alert alert-warning">
                                    <p style={{ margin: '0 0 1rem 0', fontWeight: 600 }}>You have already applied. Overwrite previous application?</p>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button onClick={() => submitApplication(true)} className="btn btn-warning">Yes, Overwrite</button>
                                        <button onClick={() => setShowOverwriteConfirm(false)} className="btn btn-secondary">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={(e) => { e.preventDefault(); submitApplication(false); }} style={{ display: 'grid', gap: '1.25rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.7fr 2fr', gap: '1rem' }}>
                                        <div><label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 500 }}>First Name *</label><input name="firstName" value={formData.firstName} onChange={handleChange} style={fieldErrors.firstName ? errorStyle : controlStyle} /></div>
                                        <div><label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 500 }}>MI</label><input name="middleInitial" value={formData.middleInitial} onChange={handleChange} maxLength={1} style={controlStyle} /></div>
                                        <div><label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 500 }}>Last Name *</label><input name="lastName" value={formData.lastName} onChange={handleChange} style={fieldErrors.lastName ? errorStyle : controlStyle} /></div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div><label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 500 }}>Email *</label><input name="email" type="email" value={formData.email} onChange={handleChange} style={fieldErrors.email ? errorStyle : controlStyle} /></div>
                                        <div><label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 500 }}>Confirm Email *</label><input name="confirmEmail" type="email" value={formData.confirmEmail} onChange={handleChange} style={fieldErrors.confirmEmail ? errorStyle : controlStyle} /></div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div><label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 500 }}>Phone *</label><input name="phone" type="tel" value={formData.phone} onChange={handleChange} style={fieldErrors.phone ? errorStyle : controlStyle} /></div>
                                        <div><label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 500 }}>LinkedIn URL</label><input name="linkedinUrl" type="url" value={formData.linkedinUrl} onChange={handleChange} style={controlStyle} placeholder="https://..." /></div>
                                    </div>

                                    <div style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px dashed var(--gray-300)' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Resume (PDF/DOCX) *</label>
                                        <input type="file" accept=".pdf,.docx" onChange={e => setResume(e.target.files ? e.target.files[0] : null)} style={{ marginBottom: '0.5rem' }} />
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Maximum file size: 10MB</div>
                                    </div>

                                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1rem' }}>Submit Application</button>
                                </form>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default JobDetails;
