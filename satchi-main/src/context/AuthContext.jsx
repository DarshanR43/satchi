import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create the context
const AuthContext = createContext();

// API base URL
const API_URL = 'http://172.17.9.96/api';



// Create a provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [loading, setLoading] = useState(true);

    // Set the token in axios headers whenever it changes
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Token ${token}`;
            localStorage.setItem('authToken', token);
        } else {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('authToken');
        }
    }, [token]);

    // Fetch user profile if a token exists on initial load
    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
                try {
                    const response = await axios.get(`${API_URL}/user/profile/`);
                    setUser(response.data.user);
                } catch (error) {
                    console.error("Failed to fetch user with stored token.", error);
                    setToken(null); // Clear invalid token
                }
            }
            setLoading(false);
        };
        fetchUser();
    }, []); // Empty dependency array means this runs once on mount

    const login = async (email, password) => {
        const response = await axios.post(`${API_URL}/user/login/`, { email, password });
        setToken(response.data.token);
        setUser(response.data.user);
        return response.data;
    };

    const logout = async () => {
        if (token) {
            try {
                await axios.post(`${API_URL}/user/logout/`);
            } catch (error) {
                console.error("Logout failed on server, logging out client-side.", error);
            }
        }
        setUser(null);
        setToken(null);
    };

    const value = {
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
    };

    // Don't render children until the initial auth check is complete
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the auth context
export const useAuth = () => {
    return useContext(AuthContext);
};
