import { useState, useEffect } from 'react';
import client from '../../api/client';
import { Link } from 'react-router-dom';

interface User {
    id: number;
    email: string;
    role: string;
    is_active: boolean;
    first_name?: string;
    last_name?: string;
}

const rolesConfig = [
    {
        key: 'admin',
        name: 'Admin',
        description: 'Full system access. Can manage users, view all jobs, and configure the platform.',
        permissions: ['Manage Users', 'View All Jobs', 'View All Applications', 'System Configuration'],
        color: 'var(--danger)',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
            </svg>
        ),
    },
    {
        key: 'client',
        name: 'Client',
        description: 'Can post jobs, view applicants, and manage their own listings.',
        permissions: ['Post Jobs', 'View Own Jobs', 'View Applicants', 'Download Resumes'],
        color: 'var(--info)',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
            </svg>
        ),
    },
    {
        key: 'candidate',
        name: 'Candidate',
        description: 'Can browse and apply for jobs, upload resumes, and track status.',
        permissions: ['Browse Jobs', 'Apply to Jobs', 'Upload Resume', 'View Application Status'],
        color: 'var(--success)',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
        ),
    },
];

const ManageRoles = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRole, setExpandedRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await client.get('/admin/users');
                setUsers(response.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const getUsersByRole = (role: string) => users.filter(u => u.role === role);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Roles & Permissions</h1>
                    <p className="subtitle">Configure role-based access control</p>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {rolesConfig.map(role => {
                    const roleUsers = getUsersByRole(role.key);
                    const isExpanded = expandedRole === role.key;

                    return (
                        <div key={role.name} className="card" style={{ borderLeft: `4px solid ${role.color}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: 'var(--radius)',
                                        background: `${role.color}15`, color: role.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {role.icon}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.125rem', marginBottom: '0.125rem' }}>{role.name}</h3>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                            {loading ? '...' : `${roleUsers.length} active user${roleUsers.length !== 1 ? 's' : ''}`}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => setExpandedRole(isExpanded ? null : role.key)}
                                        className="btn btn-secondary btn-sm"
                                    >
                                        {isExpanded ? 'Hide Users' : 'Show Users'}
                                    </button>
                                </div>
                            </div>

                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.9375rem' }}>
                                {role.description}
                            </p>

                            <div style={{ marginBottom: '1rem' }}>
                                <strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)', display: 'block', marginBottom: '0.5rem' }}>Permissions</strong>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {role.permissions.map(perm => (
                                        <span key={perm} className="badge" style={{ background: 'var(--gray-100)', color: 'var(--gray-700)', border: '1px solid var(--gray-200)' }}>
                                            ✓ {perm}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {isExpanded && (
                                <div style={{
                                    marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--gray-200)',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <strong style={{ fontSize: '0.875rem', color: 'var(--gray-900)' }}>Assigned Users</strong>
                                        <Link to="/admin/users" style={{ fontSize: '0.8125rem' }}>Manage all →</Link>
                                    </div>

                                    {roleUsers.length === 0 ? (
                                        <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', fontStyle: 'italic' }}>No users assigned to this role.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {roleUsers.map(u => (
                                                <span key={u.id} style={{
                                                    padding: '0.375rem 0.75rem',
                                                    background: 'var(--white)',
                                                    borderRadius: '999px',
                                                    fontSize: '0.8125rem',
                                                    border: '1px solid var(--gray-200)',
                                                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                                                    color: 'var(--gray-700)',
                                                }}>
                                                    <span style={{
                                                        width: '6px', height: '6px', borderRadius: '50%',
                                                        backgroundColor: u.is_active ? 'var(--success)' : 'var(--danger)',
                                                    }} />
                                                    {u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.email}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ManageRoles;
