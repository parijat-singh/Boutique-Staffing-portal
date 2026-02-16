import { Link } from 'react-router-dom';

const roles = [
    {
        key: 'admin',
        title: 'Administrator',
        icon: (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
            </svg>
        ),
        description: 'Manage users, systems, and platform configuration.',
        accent: '#ef4444',
    },
    {
        key: 'client',
        title: 'Employer',
        icon: (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
            </svg>
        ),
        description: 'Post positions, review candidates, and manage your hiring pipeline.',
        accent: '#3b82f6',
    },
    {
        key: 'candidate',
        title: 'Job Seeker',
        icon: (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        ),
        description: 'Browse open positions, submit applications, and track your progress.',
        accent: '#10b981',
    },
];

const RoleSelect = () => {
    return (
        <div className="auth-page">
            <div className="auth-hero">
                <div style={{ position: 'relative', zIndex: 1, maxWidth: '520px' }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.75rem' }}>
                        Boutique Staffing Portal
                    </p>
                    <h1 style={{ fontSize: '2.75rem', lineHeight: 1.1, marginBottom: '1rem' }}>
                        Connecting talent<br />with opportunity.
                    </h1>
                    <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', marginBottom: '2rem' }}>
                        Your dedicated platform for specialized staffing — streamlined hiring, curated candidates, and smarter placements.
                    </p>
                    <div className="stat-row">
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

            <div className="auth-form-panel" style={{ flex: '0 0 520px' }}>
                <div style={{ width: '100%', maxWidth: '420px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                        Welcome back
                    </h2>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
                        Select your role to sign in
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {roles.map(role => (
                            <Link
                                key={role.key}
                                to={`/login/${role.key}`}
                                style={{
                                    textDecoration: 'none',
                                    color: 'var(--text)',
                                    background: 'var(--white)',
                                    border: '1px solid var(--gray-200)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '1rem 1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    transition: 'all var(--transition)',
                                }}
                                onMouseOver={e => {
                                    e.currentTarget.style.borderColor = role.accent;
                                    e.currentTarget.style.boxShadow = `0 0 0 1px ${role.accent}20, var(--shadow-md)`;
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.borderColor = 'var(--gray-200)';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.transform = 'none';
                                }}
                            >
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: 'var(--radius)',
                                    background: `${role.accent}10`,
                                    color: role.accent,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    {role.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.125rem' }}>{role.title}</div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-light)', lineHeight: 1.4 }}>{role.description}</div>
                                </div>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </Link>
                        ))}
                    </div>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                            New candidate?{' '}
                            <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create an account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoleSelect;
