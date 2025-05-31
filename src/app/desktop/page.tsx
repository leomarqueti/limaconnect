
"use client"; // Convert to Client Component

import Link from 'next/link';
import { useEffect, useState } from 'react'; // For fetching data
import { getSubmissions, getMechanicById } from '@/lib/data';
import type { Submission, Mechanic } from '@/types';
import { SubmissionCard } from '@/components/desktop/SubmissionCard';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ListChecks, PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { useToast } from '@/hooks/use-toast';

export default function DesktopDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [mechanicsMap, setMechanicsMap] = useState<Record<string, Mechanic | undefined>>({});
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);

  useEffect(() => {
    async function fetchSubmissions() {
      if (!authLoading && !user) {
        // User not logged in, layout should handle redirect.
        // Or we could push to login here as well.
        setIsLoadingSubmissions(false);
        return;
      }
      
      if (user) { // Only fetch if user is available
        setIsLoadingSubmissions(true);
        try {
          const fetchedSubmissions = await getSubmissions();
          setSubmissions(fetchedSubmissions);

          // Pre-resolve mechanic details
          const resolvedMechanics: Record<string, Mechanic | undefined> = {};
          for (const sub of fetchedSubmissions) {
            if (!resolvedMechanics[sub.mechanicId]) {
              // getMechanicById is synchronous, but if it were async, we'd await it here.
              // This part will mostly be undefined if mechanicId is a UID not in the static array.
              resolvedMechanics[sub.mechanicId] = getMechanicById(sub.mechanicId);
            }
          }
          setMechanicsMap(resolvedMechanics);
        } catch (error) {
          console.error("Failed to load submissions:", error);
          toast({
            variant: "destructive",
            title: "Erro ao Carregar Submissões",
            description: "Não foi possível buscar os registros do banco de dados.",
          });
          setSubmissions([]);
        } finally {
          setIsLoadingSubmissions(false);
        }
      }
    }
    
    if (!authLoading) { // Wait for auth state to be resolved
      fetchSubmissions();
    }
  }, [user, authLoading, toast]);

  if (authLoading || (isLoadingSubmissions && user)) { // Show loader if auth is loading OR submissions are loading (and user is present)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Carregando painel...</p>
      </div>
    );
  }
  
  const officeUserId = user?.uid; // Get logged-in user's UID for new submissions from desktop

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-headline">
            Painel de Submissões
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe os orçamentos e serviços registrados.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild disabled={!officeUserId}>
            <Link href={`/desktop/new-submission?type=quote&mechanicId=${officeUserId || 'unknown_user'}`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Orçamento
            </Link>
          </Button>
          <Button asChild variant="secondary" disabled={!officeUserId}>
            <Link href={`/desktop/new-submission?type=finished&mechanicId=${officeUserId || 'unknown_user'}`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Serviço
            </Link>
          </Button>
        </div>
      </div>

      {submissions.length === 0 && !isLoadingSubmissions ? (
        <Alert>
          <ListChecks className="h-4 w-4" />
          <AlertTitle>Nenhuma Submissão</AlertTitle>
          <AlertDescription>
            Ainda não há orçamentos ou serviços registrados. Assim que os mecânicos ou o escritório enviarem, eles aparecerão aqui.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((submission) => {
            const mechanic = mechanicsMap[submission.mechanicId];
            return (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                mechanic={mechanic} 
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
