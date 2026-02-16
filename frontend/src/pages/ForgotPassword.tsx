import { useState } from 'react';
import client from '../api/client';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('candidate');
    const [message, setMessage] = useState('');
    const [tempPassword, setTempPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setTempPassword('');
        setLoading(true);

        try {
            const response = await client.post('/auth/reset-password', { email, role });
            setMessage(response.data.message);
            if (response.data.temporary_password) {
                setTempPassword(response.data.temporary_password);
            }
        } catch (err: any) {
            if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Failed to reset password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-hero">
                <div style={{ position: 'relative', zIndex: 1, maxWidth: '520px' }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.75rem' }}>
                        Boutique Staffing Portal
                    </p>
                    <h1 style={{ fontSize: '2.25rem', lineHeight: 1.15, marginBottom: '1rem' }}>
                        Forgot your password?
                    </h1>
                    <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)' }}>
                        No worries — enter your registered email and we'll send you a temporary password to get back in.
                    </p>
                </div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-form-container">
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.25rem 0.75rem', borderRadius: '999px',
                        background: 'var(--warning-bg)', color: '#92400e',
                        fontSize: '0.75rem', fontWeight: 600, marginBottom: '1rem',
                        letterSpacing: '0.03em',
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                        Password Recovery
                    </div>

                    <h2>Reset your password</h2>
                    <p className="subtitle">A temporary password will be sent to your email</p>

                    {error && <div className="alert alert-error" style={{ textAlign: 'center' }}>{error}</div>}

                    {message && (
                        <div className="alert alert-success">
                            <p style={{ margin: 0, fontWeight: 600 }}>✓ {message}</p>
                            {tempPassword && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <div className="alert alert-warning" style={{ fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                                        Dev mode — SMTP not configured
                                    </div>
                                    <div style={{
                                        padding: '0.5rem 0.75rem', background: 'var(--white)',
                                        border: '2px dashed var(--success)', borderRadius: 'var(--radius-sm)',
                                        fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700,
                                        letterSpacing: '1px', textAlign: 'center',
                                    }}>
                                        {tempPassword}
                                    </div>
                                </div>
                            )}
                            {!tempPassword && (
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>
                                    Check your inbox and use the temporary password to log in, then change it from your Profile page.
                                </p>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div>
                            <label>Email address</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@company.com" />
                        </div>
                        <div>
                            <label>Account Role</label>
                            <select value={role} onChange={e => setRole(e.target.value)}>
                                <option value="candidate">Job Seeker</option>
                                <option value="client">Employer</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>
                        <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{
                            width: '100%', background: 'var(--warning)', color: 'var(--gray-900)',
                            opacity: loading ? 0.7 : 1,
                        }}>
                            {loading ? 'Resetting...' : 'Send Reset Email'}
                        </button>
                    </form>

                    <div className="form-links" style={{ marginTop: '1.25rem' }}>
                        <Link to="/" style={{ color: 'var(--text-light)' }}>← Back to sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
