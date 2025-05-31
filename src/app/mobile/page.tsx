
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

export default function MobileHomePage() {
  const { user, loading } = useAuth(); // Get user and loading state

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Carregando dados do usuário...</p>
      </div>
    );
  }

  if (!user) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <p className="text-muted-foreground">Usuário não autenticado. Redirecionando para login...</p>
      </div>
    );
  }

  const mechanicId = user.uid; // Use the logged-in user's UID

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8 text-center font-headline">Registro de Serviço</h1>
      <p className="text-muted-foreground mb-8 text-center">Selecione o tipo de registro que deseja fazer:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-md">
        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardHeader>
            <FileText className="w-10 h-10 mx-auto text-primary mb-2" />
            <CardTitle className="font-headline">Montar Orçamento</CardTitle>
            <CardDescription>Crie um novo orçamento para o cliente.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/mobile/new-submission?type=quote&mechanicId=${mechanicId}`}>
                Iniciar Orçamento
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardHeader>
            <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-2" />
            <CardTitle className="font-headline">Serviço Finalizado</CardTitle>
            <CardDescription>Registre um serviço que foi concluído.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="secondary">
              <Link href={`/mobile/new-submission?type=finished&mechanicId=${mechanicId}`}>
                Registrar Serviço
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
