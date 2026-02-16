import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const { user, logout } = useAuth()!;
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header style={{
            background: 'var(--white)',
            padding: '0 1.5rem',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            height: '52px',
            borderBottom: '1px solid var(--gray-200)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: 'var(--text-light)', fontSize: '0.8125rem' }}>
                    {user?.email}
                </span>
                <span style={{
                    padding: '0.125rem 0.5rem',
                    background: 'var(--gray-100)',
                    borderRadius: '999px',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--gray-500)',
                }}>
                    {user?.role}
                </span>
                <button
                    onClick={handleLogout}
                    className="btn btn-danger btn-sm"
                    style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
                >
                    Sign Out
                </button>
            </div>
        </header>
    );
};

export default Header;
