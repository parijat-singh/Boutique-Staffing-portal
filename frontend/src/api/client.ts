import axios from 'axios';

const getBaseURL = () => {
    const rawUrl = import.meta.env.VITE_API_URL;
    if (!rawUrl) return '/api/v1';

    // Ensure the URL ends with /api/v1 for backend compatibility
    const normalized = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
    return normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`;
};

const client = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
});

console.log('API Client initialized with baseURL:', client.defaults.baseURL);

export default client;
