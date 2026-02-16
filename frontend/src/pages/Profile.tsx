import { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const Profile = () => {
    const { user } = useAuth()!;
    const isClient = user?.role === 'client';
    const isCandidate = user?.role === 'candidate';

    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        first_name: '', middle_initial: '', last_name: '',
        phone_number: '', email: '', city: '', state: '',
        years_of_experience: '', work_permit_type: '', linkedin_url: '', password: '',
        company_name: '', designation: '',
    });

    useEffect(() => {
        if (user) {
            setForm(prev => ({
                ...prev,
                first_name: user.first_name || '', middle_initial: user.middle_initial || '',
                last_name: user.last_name || '', phone_number: user.phone_number || '',
                email: user.email || '', city: user.city || '', state: user.state || '',
                years_of_experience: user.years_of_experience?.toString() || '',
                work_permit_type: user.work_permit_type || '', linkedin_url: user.linkedin_url || '',
                company_name: user.company_name || '', designation: user.designation || '',
            }));
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            const payload: Record<string, any> = {};
            if (form.first_name) payload.first_name = form.first_name;
            if (form.middle_initial) payload.middle_initial = form.middle_initial;
            if (form.last_name) payload.last_name = form.last_name;
            if (form.phone_number) payload.phone_number = form.phone_number;

            if (user?.role === 'candidate') {
                if (form.city) payload.city = form.city;
                if (form.state) payload.state = form.state;
                if (form.years_of_experience) payload.years_of_experience = parseInt(form.years_of_experience);
                if (form.work_permit_type) payload.work_permit_type = form.work_permit_type;
            }

            if (user?.role === 'client') {
                if (form.company_name) payload.company_name = form.company_name;
                if (form.designation) payload.designation = form.designation;
            }

            if (form.linkedin_url) payload.linkedin_url = form.linkedin_url;
            if (form.password) payload.password = form.password;

            await client.put('/users/me', payload);
            setMessage('Profile updated successfully!');
            setMessageType('success');
            setForm(prev => ({ ...prev, password: '' }));
        } catch (error) {
            console.error(error);
            setMessage('Failed to update profile');
            setMessageType('error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>My Profile</h1>
                    <p className="subtitle">Update your personal and professional information</p>
                </div>
            </div>



            <div style={{ maxWidth: '640px' }}>
                {/* Info card */}
                <div className="card" style={{
                    marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem',
                }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'var(--accent-light)', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', fontWeight: 700, flexShrink: 0,
                    }}>
                        {(user?.email || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{user?.email}</div>
                        <div style={{ color: 'var(--text-light)', textTransform: 'capitalize', fontSize: '0.8125rem' }}>{user?.role}</div>
                    </div>
                </div>

                {message && (
                    <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1rem' }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <fieldset>
                        <legend>Identity</legend>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ flex: 2 }}>
                                <label>First Name</label>
                                <input name="first_name" value={form.first_name} onChange={handleChange} />
                            </div>
                            <div style={{ flex: 0.6 }}>
                                <label>MI</label>
                                <input name="middle_initial" value={form.middle_initial} onChange={handleChange} maxLength={1} />
                            </div>
                            <div style={{ flex: 2 }}>
                                <label>Last Name</label>
                                <input name="last_name" value={form.last_name} onChange={handleChange} />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Contact</legend>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div>
                                <label>Phone Number</label>
                                <input name="phone_number" type="tel" value={form.phone_number} onChange={handleChange} />
                            </div>
                            <div>
                                <label>Email</label>
                                <input value={form.email} disabled style={{ background: 'var(--gray-50)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Email cannot be changed</small>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Professional</legend>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {isCandidate && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label>Experience (Years)</label>
                                        <input name="years_of_experience" type="number" min="0" value={form.years_of_experience} onChange={handleChange} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label>Work Permit</label>
                                        <select name="work_permit_type" value={form.work_permit_type} onChange={handleChange}>
                                            <option value="">Select...</option>
                                            <option value="US Citizen">US Citizen</option>
                                            <option value="Green Card">Green Card</option>
                                            <option value="H1B">H1B</option>
                                            <option value="L1">L1</option>
                                            <option value="OPT/CPT">OPT/CPT</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {isClient && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div>
                                        <label>Company Name</label>
                                        <input name="company_name" value={form.company_name} onChange={handleChange} placeholder="Your Company Ltd." />
                                    </div>
                                    <div>
                                        <label>Designation</label>
                                        <input name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. Hiring Manager" />
                                    </div>
                                </div>
                            )}

                            {isCandidate && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label>City</label>
                                        <input name="city" value={form.city} onChange={handleChange} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label>State</label>
                                        <select name="state" value={form.state} onChange={handleChange}>
                                            <option value="">Select...</option>
                                            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                            <option value="N/A">N/A</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label>LinkedIn Profile URL</label>
                                <input name="linkedin_url" type="url" value={form.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Security</legend>
                        <div>
                            <label>New Password</label>
                            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Leave blank to keep current" />
                        </div>
                    </fieldset>

                    <button type="submit" disabled={saving} className="btn btn-primary btn-lg" style={{
                        width: '100%',
                        opacity: saving ? 0.7 : 1,
                    }}>
                        {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
