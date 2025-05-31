
"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getArchivedSubmissionsFromFirestore, getUserFromFirestore } from '@/lib/data';
import type { Submission, UserProfile } from '@/types';
import { SubmissionCard } from '@/components/desktop/SubmissionCard';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Archive, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function DesktopHistoryPage() {
  const { toast } = useToast();
  const [archivedSubmissions, setArchivedSubmissions] = useState<Submission[]>([]);
  const [userProfilesMap, setUserProfilesMap] = useState<Record<string, UserProfile | null>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchArchivedData() {
      setIsLoading(true);
      try {
        const fetchedSubmissions = await getArchivedSubmissionsFromFirestore();
        setArchivedSubmissions(fetchedSubmissions);

        if (fetchedSubmissions.length > 0) {
          const uniqueMechanicIds = [...new Set(fetchedSubmissions.map(sub => sub.mechanicId))];
          const profiles: Record<string, UserProfile | null> = {};
          
          for (const uid of uniqueMechanicIds) {
            if (!userProfilesMap[uid]) { 
              profiles[uid] = await getUserFromFirestore(uid);
            } else {
              profiles[uid] = userProfilesMap[uid];
            }
          }
          setUserProfilesMap(prev => ({ ...prev, ...profiles }));
        }
      } catch (error) {
        console.error("Failed to load archived submissions or profiles:", error);
        // Verifica se o erro é relacionado a índice do Firestore
        if (error instanceof Error && (error.message.includes("query requires an index") || error.message.includes("needs an index"))) {
            toast({
                variant: "destructive",
                title: "Índice Necessário no Firestore",
                description: "A consulta para buscar o histórico requer um índice no Firestore. Verifique o console para o link de criação.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Erro ao Carregar Histórico",
                description: "Não foi possível buscar os registros arquivados.",
            });
        }
        setArchivedSubmissions([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchArchivedData();
  }, [toast]); // Removido userProfilesMap para evitar loop desnecessário

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-headline flex items-center">
            <Archive className="mr-3 h-8 w-8" />
            Histórico de Submissões
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize os orçamentos e serviços que foram arquivados.
          </p>
        </div>
         <Button variant="outline" asChild className="group">
          <Link href="/desktop">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Voltar ao Painel
          </Link>
        </Button>
      </div>

      {archivedSubmissions.length === 0 ? (
        <Alert>
          <Archive className="h-4 w-4" />
          <AlertTitle>Nenhuma Submissão Arquivada</AlertTitle>
          <AlertDescription>
            Ainda não há itens no histórico. Quando você arquivar uma submissão, ela aparecerá aqui.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archivedSubmissions.map((submission) => {
            const submitterProfile = userProfilesMap[submission.mechanicId];
            return (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                submitterProfile={submitterProfile || undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
