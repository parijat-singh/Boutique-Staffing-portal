import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth()!;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isActive = (path: string) => location.pathname === path;

    const linkStyle = (path: string): React.CSSProperties => ({
        color: 'rgba(255,255,255,0.65)',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.5rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        fontWeight: isActive(path) ? 600 : 400,
        fontSize: '0.875rem',
        transition: 'all 0.15s ease',
        background: isActive(path) ? 'rgba(0, 180, 216, 0.12)' : 'transparent',
        ...(isActive(path) ? { color: 'var(--accent)' } : {}),
    });

    const sectionLabel: React.CSSProperties = {
        fontSize: '0.6875rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'rgba(255,255,255,0.3)',
        padding: '1.25rem 0.75rem 0.375rem',
    };

    return (
        <aside className="sidebar" style={{
            width: '240px',
            background: 'var(--primary)',
            color: '#fff',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            zIndex: 10,
        }}>
            {/* Logo */}
            <div style={{
                padding: '1.25rem 1rem',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
            }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.875rem', fontWeight: 800,
                }}>BS</div>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>Boutique Staffing</span>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '0.5rem 0.5rem', overflowY: 'auto' }}>
                <div style={sectionLabel}>Main</div>
                <Link to="/dashboard" style={linkStyle('/dashboard')}
                    onMouseOver={e => { if (!isActive('/dashboard')) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseOut={e => { if (!isActive('/dashboard')) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isActive('/dashboard') ? 'var(--accent)' : 'rgba(255,255,255,0.65)'; }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
                    Dashboard
                </Link>
                <Link to="/profile" style={linkStyle('/profile')}
                    onMouseOver={e => { if (!isActive('/profile')) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseOut={e => { if (!isActive('/profile')) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isActive('/profile') ? 'var(--accent)' : 'rgba(255,255,255,0.65)'; }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    Profile
                </Link>

                {user?.role === 'candidate' && (
                    <>
                        <div style={sectionLabel}>Job Search</div>
                        <Link to="/dashboard" style={linkStyle('/dashboard')}
                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                            Browse Jobs
                        </Link>
                        <Link to="/applications" style={linkStyle('/applications')}
                            onMouseOver={e => { if (!isActive('/applications')) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseOut={e => { if (!isActive('/applications')) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isActive('/applications') ? 'var(--accent)' : 'rgba(255,255,255,0.65)'; }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                            My Applications
                        </Link>
                    </>
                )}

                {user?.role === 'client' && (
                    <>
                        <div style={sectionLabel}>Recruiting</div>
                        <Link to="/jobs/new" style={linkStyle('/jobs/new')}
                            onMouseOver={e => { if (!isActive('/jobs/new')) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseOut={e => { if (!isActive('/jobs/new')) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isActive('/jobs/new') ? 'var(--accent)' : 'rgba(255,255,255,0.65)'; }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            Post a Job
                        </Link>
                    </>
                )}

                {user?.role === 'admin' && (
                    <>
                        <div style={sectionLabel}>Administration</div>
                        <Link to="/admin/users" style={linkStyle('/admin/users')}
                            onMouseOver={e => { if (!isActive('/admin/users')) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseOut={e => { if (!isActive('/admin/users')) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isActive('/admin/users') ? 'var(--accent)' : 'rgba(255,255,255,0.65)'; }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
                            Manage Users
                        </Link>
                        <Link to="/admin/roles" style={linkStyle('/admin/roles')}
                            onMouseOver={e => { if (!isActive('/admin/roles')) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseOut={e => { if (!isActive('/admin/roles')) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isActive('/admin/roles') ? 'var(--accent)' : 'rgba(255,255,255,0.65)'; }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            Roles
                        </Link>
                    </>
                )}
            </nav>

            {/* Footer */}
            <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    marginBottom: '0.75rem',
                }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'rgba(0, 180, 216, 0.15)', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700,
                    }}>
                        {(user?.email || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.email}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
                            {user?.role}
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        background: 'rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.6)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        width: '100%',
                        padding: '0.4375rem',
                        fontSize: '0.8125rem',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 500,
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
