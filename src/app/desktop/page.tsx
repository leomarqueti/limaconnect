
"use client"; 

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSubmissions, getUserFromFirestore } from '@/lib/data'; // Import getUserFromFirestore
import type { Submission, UserProfile } from '@/types'; // Import UserProfile
import { SubmissionCard } from '@/components/desktop/SubmissionCard';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ListChecks, PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function DesktopDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userProfilesMap, setUserProfilesMap] = useState<Record<string, UserProfile | null>>({}); // Store fetched profiles
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

  useEffect(() => {
    async function fetchSubmissionsAndProfiles() {
      if (!authLoading && !user) {
        setIsLoadingSubmissions(false);
        return;
      }
      
      if (user) {
        setIsLoadingSubmissions(true);
        setIsLoadingProfiles(true);
        try {
          const fetchedSubmissions = await getSubmissions();
          setSubmissions(fetchedSubmissions);

          // Fetch user profiles for each unique mechanicId
          const uniqueMechanicIds = [...new Set(fetchedSubmissions.map(sub => sub.mechanicId))];
          const profiles: Record<string, UserProfile | null> = {};
          
          for (const uid of uniqueMechanicIds) {
            if (!userProfilesMap[uid]) { // Avoid refetching if already fetched
              profiles[uid] = await getUserFromFirestore(uid);
            } else {
              profiles[uid] = userProfilesMap[uid];
            }
          }
          setUserProfilesMap(prev => ({ ...prev, ...profiles }));
          setIsLoadingProfiles(false);

        } catch (error) {
          console.error("Failed to load submissions or profiles:", error);
          toast({
            variant: "destructive",
            title: "Erro ao Carregar Dados",
            description: "Não foi possível buscar os registros ou perfis do banco de dados.",
          });
          setSubmissions([]);
          setIsLoadingProfiles(false);
        } finally {
          setIsLoadingSubmissions(false);
        }
      }
    }
    
    if (!authLoading) {
      fetchSubmissionsAndProfiles();
    }
  }, [user, authLoading, toast]); // Removed userProfilesMap from dependencies to avoid loop, will manage refetching differently if needed

  if (authLoading || (isLoadingSubmissions && user)) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Carregando painel...</p>
      </div>
    );
  }
  
  const officeUserId = user?.uid;

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

      {submissions.length === 0 && !isLoadingSubmissions && !isLoadingProfiles ? (
        <Alert>
          <ListChecks className="h-4 w-4" />
          <AlertTitle>Nenhuma Submissão</AlertTitle>
          <AlertDescription>
            Ainda não há orçamentos ou serviços registrados. Assim que os mecânicos ou o escritório enviarem, eles aparecerão aqui.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {(isLoadingSubmissions || isLoadingProfiles) && submissions.length === 0 && (
             <div className="flex justify-center items-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Carregando registros...</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map((submission) => {
              const submitterProfile = userProfilesMap[submission.mechanicId];
              return (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  submitterProfile={submitterProfile || undefined} // Pass undefined if profile is null or not found
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
