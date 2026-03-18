"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

interface User {
    id: number;
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
}

interface AuthCtx {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthCtx>({
    user: null,
    token: null,
    login: async () => { },
    logout: () => { },
    loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const t = localStorage.getItem("token");
        const u = localStorage.getItem("user");
        if (t && u) {
            setToken(t);
            setUser(JSON.parse(u));
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const res = await authApi.login(email, password);
        const { access_token, user: userData } = res.data;
        localStorage.setItem("token", access_token);
        localStorage.setItem("user", JSON.stringify(userData));
        setToken(access_token);
        setUser(userData);
        router.push("/dashboard");
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
