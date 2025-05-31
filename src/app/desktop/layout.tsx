
"use client";

import { AppHeader } from '@/components/shared/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function DesktopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?origin=desktop');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/40">
        <AppHeader /> {/* Pode querer um header mais simples ou nenhum durante o loading global */}
        <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-center">
          <div>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="mt-2 text-muted-foreground text-center">Verificando autenticação...</p>
          </div>
        </main>
        <footer className="text-center py-4 border-t bg-background">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Lima Connect - Painel Desktop
          </p>
        </footer>
      </div>
    );
  }

  if (!user) {
    // O useEffect deve redirecionar, isso é um fallback.
    // Pode-se retornar null ou um loader específico de "redirecionando".
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
          &copy; {new Date().getFullYear()} Lima Connect - Painel Desktop
        </p>
      </footer>
    </div>
  );
}
