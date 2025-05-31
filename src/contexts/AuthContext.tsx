
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
import { addUserToFirestore, getUserFromFirestore, updateUserProfileInFirestore } from '@/lib/data'; // Import Firestore functions

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
  updateUserProfile: (newData: { displayName?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true); 
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
      // onAuthStateChanged will fetch and set profile, but we can pre-emptively fetch for quicker UI update if desired.
      // For consistency, we'll rely on onAuthStateChanged to set the full AppUser.
      // const userProfile = await getUserFromFirestore(firebaseUser.uid);
      // const appUser = { ...firebaseUser, profile: userProfile };
      // setUser(appUser); 
      return firebaseUser as AppUser; // Cast, as profile will be populated by onAuthStateChanged
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
      
      const displayName = email.split('@')[0] || 'Novo Usuário';
      await addUserToFirestore(firebaseUser.uid, firebaseUser.email!, displayName);
      
      // onAuthStateChanged will fetch and set profile.
      // const userProfile = await getUserFromFirestore(firebaseUser.uid);
      // const appUser = { ...firebaseUser, profile: userProfile };
      // setUser(appUser);
      return firebaseUser as AppUser; // Cast, profile via onAuthStateChanged
    } catch (error) {
      const authError = error as AuthError;
      console.error("Registration error:", authError.code, authError.message);
      throw authError; 
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

  const updateUserProfile = async (newData: { displayName?: string; photoURL?: string }) => {
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }
    try {
      await updateUserProfileInFirestore(user.uid, newData);
      // Fetch the updated profile to refresh the context
      const updatedProfile = await getUserFromFirestore(user.uid);
      setUser(prevUser => prevUser ? { ...prevUser, profile: updatedProfile } : null);
      toast({ title: "Perfil Atualizado", description: "Suas informações foram salvas." });
    } catch (error) {
      console.error("Error updating user profile:", error);
      toast({ variant: "destructive", title: "Erro ao Atualizar", description: "Não foi possível salvar as alterações." });
      throw error; // Re-throw for the form to handle
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    updateUserProfile,
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
