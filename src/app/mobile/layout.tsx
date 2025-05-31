
"use client";

import { AppHeader } from '@/components/shared/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Adiciona verificação para não redirecionar se já estiver na página de login
    // ou se for uma rota pública específica dentro de /mobile (se houver no futuro).
    // Por agora, assume que todo /mobile é protegido.
    if (!loading && !user) {
      router.push('/login?origin=mobile');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-6 flex justify-center items-center">
          <div>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="mt-2 text-muted-foreground text-center">Verificando autenticação...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null; 
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
