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

    const navLinkClass = (path: string) => `sidebar-link ${isActive(path) ? 'active' : ''}`;

    return (
        <aside className="sidebar">
            {/* Logo - hidden on mobile row if desired, or kept small */}
            <div className="sidebar-logo">
                <div className="logo-icon">BS</div>
                <span className="logo-text">Boutique Staffing</span>
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
                <div className="sidebar-section-label">Main</div>
                <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
                    <span>Dashboard</span>
                </Link>
                <Link to="/profile" className={navLinkClass('/profile')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    <span>Profile</span>
                </Link>

                {user?.role === 'candidate' && (
                    <>
                        <div className="sidebar-section-label">Job Search</div>
                        <Link to="/dashboard" className="sidebar-link">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                            <span>Browse Jobs</span>
                        </Link>
                        <Link to="/applications" className={navLinkClass('/applications')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                            <span>Applications</span>
                        </Link>
                    </>
                )}

                {user?.role === 'client' && (
                    <>
                        <div className="sidebar-section-label">Recruiting</div>
                        <Link to="/jobs/new" className={navLinkClass('/jobs/new')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            <span>Post a Job</span>
                        </Link>
                    </>
                )}

                {user?.role === 'admin' && (
                    <>
                        <div className="sidebar-section-label">Admin</div>
                        <Link to="/admin/users" className={navLinkClass('/admin/users')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
                            <span>Users</span>
                        </Link>
                        <Link to="/admin/roles" className={navLinkClass('/admin/roles')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            <span>Roles</span>
                        </Link>
                        <Link to="/admin/jobs" className={navLinkClass('/admin/jobs')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <span>Jobs</span>
                        </Link>
                    </>
                )}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="user-brief">
                    <div className="avatar-mini">
                        {(user?.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="user-info-text">
                        <div className="email">{user?.email}</div>
                    </div>
                </div>
                <button onClick={handleLogout} className="btn-signout">
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
