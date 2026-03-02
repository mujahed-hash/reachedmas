import React, { createContext, useContext, useEffect, useState } from "react";
import { loadToken, getToken, clearToken, login as apiLogin } from "./api";

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadToken().then(() => {
            setIsAuthenticated(!!getToken());
            setIsLoading(false);
        });
    }, []);

    const login = async (email: string, password: string) => {
        await apiLogin(email, password);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        await clearToken();
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
