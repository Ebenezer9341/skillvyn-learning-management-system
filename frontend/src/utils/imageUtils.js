const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const getImageUrl = (path, fallback = '') => {
    if (!path) return fallback;
    if (path.startsWith('http')) return path;
    
    // Ensure path starts with a slash
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // Remove trailing slash from base URL if present
    const cleanBaseUrl = API_BASE_URL.replace(/\/$/, '');
    
    return `${cleanBaseUrl}${normalizedPath}`;
};
