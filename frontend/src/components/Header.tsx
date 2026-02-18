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
        <header className="app-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="text-muted" style={{ fontSize: '0.8125rem' }}>
                    {user?.email}
                </span>
                <span className="badge badge-info">
                    {user?.role}
                </span>
                <button
                    onClick={handleLogout}
                    className="btn btn-danger btn-sm"
                >
                    Sign Out
                </button>
            </div>
        </header>
    );
};

export default Header;
