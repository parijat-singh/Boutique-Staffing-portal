import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const cards = [
    {
        to: '/admin/users',
        title: 'Users',
        description: 'Manage all users and account statuses',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
        ),
        color: 'var(--info)',
    },
    {
        to: '/admin/roles',
        title: 'Roles & Permissions',
        description: 'View and configure role-based access',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
        color: 'var(--success)',
    },
];

const AdminDashboard = () => {
    const { user } = useAuth()!;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Admin Dashboard</h1>
                    <p className="subtitle">System administration and user management</p>
                </div>
            </div>

            {/* Quick stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: 'var(--radius)',
                        background: 'var(--accent-light)', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Signed in as</div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.email}</div>
                    </div>
                </div>
            </div>

            {/* Navigation cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {cards.map(card => (
                    <Link
                        key={card.to}
                        to={card.to}
                        className="card card-clickable"
                        style={{
                            textDecoration: 'none',
                            color: 'inherit',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '1rem',
                        }}
                    >
                        <div style={{
                            width: '44px', height: '44px', borderRadius: 'var(--radius)',
                            background: `${card.color}15`,
                            color: card.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            {card.icon}
                        </div>
                        <div>
                            <h3 style={{ marginBottom: '0.25rem' }}>{card.title}</h3>
                            <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.8125rem', lineHeight: 1.4 }}>{card.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;
