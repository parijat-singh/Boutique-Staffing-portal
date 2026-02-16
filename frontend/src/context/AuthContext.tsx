import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

interface User {
    email: string;
    role: string;
    is_active: boolean;
    first_name?: string;
    middle_initial?: string;
    last_name?: string;
    phone_number?: string;
    city?: string;
    state?: string;
    years_of_experience?: number;
    work_permit_type?: string;
    linkedin_url?: string;
    company_name?: string;
    designation?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const response = await client.get('/users/me');
                setUser(response.data);
            }
        } catch (error) {
            console.error(error);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = async (token: string) => {
        localStorage.setItem('token', token);
        client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await fetchUser();
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
