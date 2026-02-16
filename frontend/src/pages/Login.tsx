import { useState } from 'react';
import client from '../api/client';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleConfig: Record<string, { title: string; label: string; accent: string }> = {
    admin: { title: 'Administrator', label: 'Admin', accent: '#ef4444' },
    client: { title: 'Employer', label: 'Client', accent: '#3b82f6' },
    candidate: { title: 'Job Seeker', label: 'Candidate', accent: '#10b981' },
};

const Login = () => {
    const { role } = useParams<{ role: string }>();
    const config = roleConfig[role || ''] || roleConfig.candidate;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth()!;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await client.post(`/auth/login/access-token?role=${role}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            await login(response.data.access_token);
            navigate('/dashboard');
        } catch (err: any) {
            console.error(err);
            if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Invalid credentials');
            }
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
                        Your career starts here.
                    </h1>
                    <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)' }}>
                        Sign in to access your personalized dashboard, manage applications, and connect with top employers.
                    </p>
                    <div className="stat-row" style={{ marginTop: '2.5rem' }}>
                        <div className="stat-item">
                            <div className="stat-number">500+</div>
                            <div className="stat-label">Placements</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">150+</div>
                            <div className="stat-label">Clients</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">98%</div>
                            <div className="stat-label">Satisfaction</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-form-container">
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.25rem 0.75rem', borderRadius: '999px',
                        background: `${config.accent}15`, color: config.accent,
                        fontSize: '0.75rem', fontWeight: 600, marginBottom: '1rem',
                        letterSpacing: '0.03em',
                    }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: config.accent }}></span>
                        {config.title}
                    </div>

                    <h2>Sign in to your account</h2>
                    <p className="subtitle">Enter your credentials to continue</p>

                    {error && (
                        <div className="alert alert-error" style={{ textAlign: 'center' }}>{error}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div>
                            <label>Email address</label>
                            <input type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div>
                            <label>Password</label>
                            <input type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', background: config.accent }}>
                            Sign In
                        </button>
                    </form>

                    <div className="form-links" style={{ marginTop: '1.25rem' }}>
                        <Link to="/forgot-password">Forgot your password?</Link>
                        <Link to="/" style={{ color: 'var(--text-light)' }}>← Choose a different role</Link>
                    </div>

                    <div className="divider" style={{ margin: '1rem 0' }}>or</div>
                    <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                        Don't have an account?{' '}
                        <Link to={`/signup?role=${role}`} style={{ fontWeight: 600 }}>Register here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
