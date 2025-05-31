
"use client";

import type { User as FirebaseUser } from 'firebase/auth'; // Renamed to avoid conflict
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase'; 
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword,
  type AuthError
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/types'; // Import UserProfile
import { addUserToFirestore, getUserFromFirestore } from '@/lib/data'; // Import Firestore functions

// Combine FirebaseUser with UserProfile
export interface AppUser extends FirebaseUser {
  profile?: UserProfile | null; // UserProfile can be null if not found or during loading
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<AppUser | null>;
  logout: () => Promise<void>;
  register: (email: string, pass: string) => Promise<AppUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true); // Set loading true while fetching profile
      if (firebaseUser) {
        const userProfile = await getUserFromFirestore(firebaseUser.uid);
        setUser({ ...firebaseUser, profile: userProfile });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<AppUser | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const userProfile = await getUserFromFirestore(firebaseUser.uid);
      const appUser = { ...firebaseUser, profile: userProfile };
      setUser(appUser); // onAuthStateChanged will also trigger, this provides immediate update
      return appUser;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Login error:", authError.message);
      throw authError; 
    }
  };

  const register = async (email: string, password: string): Promise<AppUser | null> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Create a simple display name from email (part before @)
      const displayName = email.split('@')[0] || 'Novo Usuário';
      await addUserToFirestore(firebaseUser.uid, firebaseUser.email!, displayName);
      
      // Fetch the newly created profile
      const userProfile = await getUserFromFirestore(firebaseUser.uid);
      const appUser = { ...firebaseUser, profile: userProfile };
      // onAuthStateChanged will also handle setting the user, but this ensures profile is available sooner
      setUser(appUser);
      return appUser;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Registration error:", authError.code, authError.message);
      throw authError; 
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null); // onAuthStateChanged will also set user to null
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
    register,
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
