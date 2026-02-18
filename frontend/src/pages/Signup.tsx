import { useState } from 'react';
import client from '../api/client';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const Signup = () => {
    const navigate = useNavigate();
    const { login } = useAuth()!;
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role') === 'client' ? 'client' : 'candidate';

    const [formData, setFormData] = useState({
        email: '', confirmEmail: '', password: '', confirmPassword: '',
        first_name: '', middle_initial: '', last_name: '',
        phone_number: '', city: '', state: '',
        years_of_experience: '', work_permit_type: '', linkedin_url: '',
        company_name: '', designation: '',
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const errors: Record<string, string> = {};

        // Identity (Common)
        if (!formData.first_name.trim()) errors.first_name = 'Required';
        else if (!/^[A-Za-z\s\-']+$/.test(formData.first_name.trim())) errors.first_name = 'Letters, spaces, hyphens only';
        if (!formData.last_name.trim()) errors.last_name = 'Required';
        else if (!/^[A-Za-z\s\-']+$/.test(formData.last_name.trim())) errors.last_name = 'Letters, spaces, hyphens only';

        // Account (Common)
        if (!formData.email) errors.email = 'Required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email';
        if (formData.email !== formData.confirmEmail) errors.confirmEmail = 'Emails do not match';
        if (!formData.password || formData.password.length < 6) errors.password = 'Min 6 characters';
        if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';

        // Contact (Common Phone)
        if (!formData.phone_number.trim()) errors.phone_number = 'Required';
        else {
            const digits = formData.phone_number.replace(/[\s\-\(\)\+]/g, '');
            const normalized = digits.startsWith('1') && digits.length === 11 ? digits.slice(1) : digits;
            if (!/^\d{10}$/.test(normalized)) errors.phone_number = 'Must be 10-digit US number';
        }

        if (role === 'candidate') {
            // Match Candidate Requirements
            if (formData.city.trim() && !/^[A-Za-z\s\-]+$/.test(formData.city.trim())) errors.city = 'Letters and hyphens only';
            if (formData.state && formData.state !== 'N/A' && !US_STATES.includes(formData.state)) errors.state = 'Select a valid state';

            if (!formData.years_of_experience.trim()) errors.years_of_experience = 'Required';
            else { const y = parseInt(formData.years_of_experience); if (isNaN(y) || y < 0 || y > 50) errors.years_of_experience = '0–50'; }

            if (!formData.work_permit_type) errors.work_permit_type = 'Required';

            if (!formData.linkedin_url.trim()) errors.linkedin_url = 'Required';
            else if (!/^https?:\/\/(www\.)?linkedin\.com\/in\/[\w\-]+\/?$/.test(formData.linkedin_url.trim())) errors.linkedin_url = 'e.g. https://linkedin.com/in/name';
        } else {
            // Match Client Requirements
            if (!formData.company_name.trim()) errors.company_name = 'Required';
            if (!formData.designation.trim()) errors.designation = 'Required';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setError('');
        try {
            const payload: any = {
                email: formData.email,
                password: formData.password,
                role: role,
                first_name: formData.first_name.trim(),
                middle_initial: formData.middle_initial || null,
                last_name: formData.last_name.trim(),
                phone_number: formData.phone_number.trim(),
            };

            if (role === 'candidate') {
                payload.city = formData.city.trim() || null;
                payload.state = formData.state || null;
                payload.years_of_experience = parseInt(formData.years_of_experience);
                payload.work_permit_type = formData.work_permit_type;
                payload.linkedin_url = formData.linkedin_url.trim();
            } else {
                payload.company_name = formData.company_name.trim();
                payload.designation = formData.designation.trim();
                // Explicitly send null/undefined for others if needed, but backend handles optional
            }

            const response = await client.post('/auth/signup', payload);
            login(response.data.access_token);
            navigate('/dashboard');
        } catch (err: any) {
            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;
                setError(Array.isArray(detail) ? detail.map((d: any) => d.msg || d).join('; ') : detail);
            } else { setError('Registration failed.'); }
        }
    };

    const inputStyle = (field: string): React.CSSProperties => ({
        borderColor: fieldErrors[field] ? 'var(--danger)' : undefined,
        boxShadow: fieldErrors[field] ? '0 0 0 3px rgba(239,68,68,0.1)' : undefined,
    });

    const err = (field: string) =>
        fieldErrors[field] ? <small style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.125rem', display: 'block' }}>{fieldErrors[field]}</small> : null;

    const req = <span style={{ color: 'var(--danger)', marginLeft: '2px' }}>*</span>;

    const isClient = role === 'client';
    // const accentColor = isClient ? 'var(--info)' : 'var(--success-bg)'; // unused
    const accentText = isClient ? 'var(--info)' : '#065f46';
    const bgBadge = isClient ? 'rgba(59, 130, 246, 0.1)' : 'var(--success-bg)';

    return (
        <div className="auth-page">
            <div className="auth-hero">
                <div style={{ position: 'relative', zIndex: 1, maxWidth: '520px' }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.75rem' }}>
                        Boutique Staffing Portal
                    </p>
                    <h1 style={{ fontSize: '2.25rem', lineHeight: 1.15, marginBottom: '1rem' }}>
                        {isClient ? 'Hire the best talent.' : 'Start your career journey today.'}
                    </h1>
                    <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)' }}>
                        {isClient
                            ? 'Connect with top-tier candidates and streamline your hiring process with our specialized platform.'
                            : "Join thousands of professionals who've found their ideal role through our specialized staffing network."
                        }
                    </p>
                    <div className="stat-row" style={{ marginTop: '2.5rem' }}>
                        <div className="stat-item"><div className="stat-number">500+</div><div className="stat-label">Placements</div></div>
                        <div className="stat-item"><div className="stat-number">150+</div><div className="stat-label">Clients</div></div>
                        <div className="stat-item"><div className="stat-number">98%</div><div className="stat-label">Satisfaction</div></div>
                    </div>
                </div>
            </div>

            <div className="auth-form-panel" style={{ flex: '0 0 560px', overflowY: 'auto' }}>
                <div style={{ width: '100%', maxWidth: '460px', padding: '1rem 0' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.25rem 0.75rem', borderRadius: '999px',
                        background: bgBadge, color: accentText,
                        fontSize: '0.75rem', fontWeight: 600, marginBottom: '1rem',
                    }}>
                        {isClient ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        )}
                        {isClient ? 'Employer Registration' : 'Candidate Registration'}
                    </div>

                    <h2 style={{ fontSize: '1.375rem' }}>Create your account</h2>
                    <p className="subtitle" style={{ marginBottom: '1.25rem' }}>Fill in your details to get started</p>

                    {error && <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        <div className="section-title">Identity</div>
                        <div className="form-grid grid-3">
                            <div className="form-group" style={{ gridColumn: 'span 1' }}>
                                <label>First Name {req}</label>
                                <input name="first_name" value={formData.first_name} onChange={handleChange} style={inputStyle('first_name')} />
                                {err('first_name')}
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 1' }}>
                                <label>MI</label>
                                <input name="middle_initial" value={formData.middle_initial} onChange={handleChange} maxLength={1} />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 1' }}>
                                <label>Last Name {req}</label>
                                <input name="last_name" value={formData.last_name} onChange={handleChange} style={inputStyle('last_name')} />
                                {err('last_name')}
                            </div>
                        </div>

                        {/* Professional Info (Client Specific) */}
                        {isClient && (
                            <>
                                <div className="section-title">Professional Info</div>
                                <div className="form-grid grid-2">
                                    <div className="form-group">
                                        <label>Company Name {req}</label>
                                        <input name="company_name" value={formData.company_name} onChange={handleChange} style={inputStyle('company_name')} placeholder="Your Company Ltd." />
                                        {err('company_name')}
                                    </div>
                                    <div className="form-group">
                                        <label>Designation {req}</label>
                                        <input name="designation" value={formData.designation} onChange={handleChange} style={inputStyle('designation')} placeholder="e.g. Hiring Manager" />
                                        {err('designation')}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Account */}
                        <div className="section-title">Account</div>
                        <div className="form-grid grid-2">
                            <div className="form-group">
                                <label>Email {req}</label>
                                <input name="email" type="email" value={formData.email} onChange={handleChange} style={inputStyle('email')} placeholder="name@company.com" />
                                {err('email')}
                            </div>
                            <div className="form-group">
                                <label>Confirm Email {req}</label>
                                <input name="confirmEmail" type="email" value={formData.confirmEmail} onChange={handleChange} style={inputStyle('confirmEmail')} />
                                {err('confirmEmail')}
                            </div>
                            <div className="form-group">
                                <label>Password {req}</label>
                                <input name="password" type="password" value={formData.password} onChange={handleChange} style={inputStyle('password')} placeholder="Min 6 characters" />
                                {err('password')}
                            </div>
                            <div className="form-group">
                                <label>Confirm Password {req}</label>
                                <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} style={inputStyle('confirmPassword')} />
                                {err('confirmPassword')}
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="section-title">Contact</div>
                        <div className="form-grid grid-2">
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Phone Number {req}</label>
                                <input name="phone_number" type="tel" value={formData.phone_number} onChange={handleChange} style={inputStyle('phone_number')} placeholder="(555) 123-4567" />
                                {err('phone_number')}
                            </div>

                            {!isClient && (
                                <div className="form-grid grid-2" style={{ gridColumn: 'span 2' }}>
                                    <div className="form-group">
                                        <label>City</label>
                                        <input name="city" value={formData.city} onChange={handleChange} style={inputStyle('city')} />
                                        {err('city')}
                                    </div>
                                    <div className="form-group">
                                        <label>State</label>
                                        <select name="state" value={formData.state} onChange={handleChange} style={inputStyle('state')}>
                                            <option value="">Select...</option>
                                            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                            <option value="N/A">N/A</option>
                                        </select>
                                        {err('state')}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Professional (Candidate Specific) */}
                        {!isClient && (
                            <>
                                <div className="section-title">Professional</div>
                                <div className="form-grid grid-2">
                                    <div className="form-group">
                                        <label>Experience (Years) {req}</label>
                                        <input name="years_of_experience" type="number" min="0" max="50" value={formData.years_of_experience} onChange={handleChange} style={inputStyle('years_of_experience')} placeholder="0–50" />
                                        {err('years_of_experience')}
                                    </div>
                                    <div className="form-group">
                                        <label>Work Permit {req}</label>
                                        <select name="work_permit_type" value={formData.work_permit_type} onChange={handleChange} style={inputStyle('work_permit_type')}>
                                            <option value="">Select...</option>
                                            <option value="US Citizen">US Citizen</option>
                                            <option value="Green Card">Green Card</option>
                                            <option value="H1B">H1B</option>
                                            <option value="L1">L1</option>
                                            <option value="OPT/CPT">OPT/CPT</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        {err('work_permit_type')}
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>LinkedIn URL {req}</label>
                                        <input name="linkedin_url" type="url" value={formData.linkedin_url} onChange={handleChange} style={inputStyle('linkedin_url')} placeholder="https://linkedin.com/in/yourname" />
                                        {err('linkedin_url')}
                                    </div>
                                </div>
                            </>
                        )}

                        <div style={{ marginTop: '1rem' }}>
                            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', background: isClient ? 'var(--info)' : 'var(--success)' }}>
                                {isClient ? 'Register Employer' : 'Create Candidate Account'}
                            </button>
                        </div>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                        Already have an account? <Link to={`/login/${role}`}>Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
