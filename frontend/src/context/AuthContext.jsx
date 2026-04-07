import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(localStorage.getItem('access_token'));
    const [loading, setLoading] = useState(true);

    const logout = () => {
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    };

    // ✅ AFTER
    useEffect(() => {
        const verifySession = async () => {
            if (!accessToken) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('/api/users/me', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    const freshUser = data.data.user;
                    setUser(freshUser);
                    // Keep localStorage in sync with server truth
                    localStorage.setItem('user', JSON.stringify(freshUser));
                } else {
                    // Token is invalid or expired — force logout
                    logout();
                }
            } catch {
                // Network error — fall back to localStorage so app works offline
                const storedUser = localStorage.getItem('user');
                if (storedUser) setUser(JSON.parse(storedUser));
            } finally {
                setLoading(false);
            }
        };

        verifySession();
    }, [accessToken]);

    const login = (userData, access, refresh) => {
        setUser(userData);
        setAccessToken(access);
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('user', JSON.stringify(userData));
    };



    const updateUser = (updatedUser) => {
        setUser(updatedUser);                                      // update React state
        localStorage.setItem('user', JSON.stringify(updatedUser)); // sync localStorage
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, login, logout, loading, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
