'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface User {
  username: string;
  trustLevel: number;
  avatarUrl: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, apiConfigId?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/', '/login'];
const ADMIN_PATHS = ['/admin'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      handleRouteProtection();
    }
  }, [pathname, user, isLoading]);

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleRouteProtection() {
    const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
    const isAdminPath = ADMIN_PATHS.some(path => pathname.startsWith(path));

    if (isAdminPath && !user) {
      router.push(`/login?from=${encodeURIComponent(pathname)}`);
      return;
    }

    if (pathname === '/login' && user) {
      router.push('/');
    }
  }

  async function login(username: string, apiConfigId?: string) {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, apiConfigId }),
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    } else {
      const data = await res.json();
      throw new Error(data.error || 'Login failed');
    }
  }

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' });
    setUser(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
