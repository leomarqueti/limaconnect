
"use client";

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase'; 
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword, // Adicionado
  type AuthError
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User | null>;
  logout: () => Promise<void>;
  register: (email: string, pass: string) => Promise<User | null>; // Adicionado
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Login error:", authError.message);
      throw authError; 
    }
  };

  const register = async (email: string, password: string): Promise<User | null> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // O onAuthStateChanged cuidará de setar o user globalmente.
      // setUser(userCredential.user); // Não é estritamente necessário aqui devido ao listener
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Registration error:", authError.code, authError.message);
      throw authError; // Re-throw para ser pego na página de registro
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Sair",
        description: "Não foi possível fazer logout. Tente novamente.",
      });
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register, // Adicionado
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
