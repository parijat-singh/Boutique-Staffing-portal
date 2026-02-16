import { useState, useEffect } from 'react';
import client from '../../api/client';

interface User {
    id: number;
    email: string;
    role: string;
    is_active: boolean;
    first_name?: string;
    last_name?: string;
    city?: string;
    state?: string;
}

const ManageUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await client.get('/admin/users');
            setUsers(response.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
        try {
            const response = await client.put(`/admin/users/${userId}/status?is_active=${!currentStatus}`);
            setUsers(users.map(u => u.id === userId ? { ...u, is_active: response.data.is_active } : u));
        } catch (err) {
            console.error(err);
            alert('Failed to update user status.');
        }
    };

    if (loading) return (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <p style={{ marginTop: '0.5rem' }}>Loading users...</p>
        </div>
    );

    if (error) return <div className="alert alert-error">{error}</div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Manage Users</h1>
                    <p className="subtitle">View and manage system access</p>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                    {users.length} total user{users.length !== 1 ? 's' : ''}
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ margin: 0, border: 'none', borderRadius: 0 }}>
                        <thead style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                            <tr>
                                <th style={{ padding: '1rem', width: '60px' }}>ID</th>
                                <th style={{ padding: '1rem' }}>User</th>
                                <th style={{ padding: '1rem' }}>Role</th>
                                <th style={{ padding: '1rem' }}>Location</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                    <td style={{ padding: '1rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>#{u.id}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>
                                            {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : '—'}
                                        </div>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-light)' }}>{u.email}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'client' ? 'badge-info' : 'badge-success'}`} style={{ textTransform: 'capitalize' }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {u.city && u.state ? `${u.city}, ${u.state}` : '—'}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className={`badge ${u.is_active ? 'badge-success' : 'badge-warning'}`}>
                                            {u.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => toggleUserStatus(u.id, u.is_active)}
                                            className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                                            style={{ minWidth: '90px' }}
                                        >
                                            {u.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManageUsers;
