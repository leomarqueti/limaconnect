
"use client";

import { AppHeader } from '@/components/shared/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function TabletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?origin=tablet');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/40">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-center">
          <div>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="mt-2 text-muted-foreground text-center">Verificando autenticação...</p>
          </div>
        </main>
        <footer className="text-center py-4 border-t bg-background">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Lima Connect - Interface de Check-in Tablet
          </p>
        </footer>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="text-center py-4 border-t bg-background">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Lima Connect - Interface de Check-in Tablet
        </p>
      </footer>
    </div>
  );
}
