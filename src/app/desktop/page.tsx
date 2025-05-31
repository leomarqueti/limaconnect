
"use client"; 

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { getSubmissions, getUserFromFirestore } from '@/lib/data';
import type { Submission, UserProfile, SubmissionType } from '@/types';
import { SubmissionCard } from '@/components/desktop/SubmissionCard';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ListChecks, PlusCircle, Loader2, Filter as FilterIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';

export default function DesktopDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userProfilesMap, setUserProfilesMap] = useState<Record<string, UserProfile | null>>({});
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

  const [filterType, setFilterType] = useState<SubmissionType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'pending' | 'viewed' | 'all'>('all');

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
          const fetchedSubmissions = await getSubmissions(); // Fetches only non-archived
          setSubmissions(fetchedSubmissions);

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
          setIsLoadingProfiles(false);

        } catch (error) {
          console.error("Failed to load submissions or profiles:", error);
           // Verifica se o erro é relacionado a índice do Firestore
           if (error instanceof Error && (error.message.includes("query requires an index") || error.message.includes("needs an index"))) {
              toast({
                  variant: "destructive",
                  title: "Índice Necessário no Firestore",
                  description: "A consulta para buscar as submissões ativas requer um índice no Firestore. Verifique o console para o link de criação.",
              });
          } else {
            toast({
              variant: "destructive",
              title: "Erro ao Carregar Dados",
              description: "Não foi possível buscar os registros ou perfis do banco de dados.",
            });
          }
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
  }, [user, authLoading, toast]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      const typeMatch = filterType === 'all' || submission.type === filterType;
      const statusMatch = filterStatus === 'all' || submission.status === filterStatus;
      return typeMatch && statusMatch;
    });
  }, [submissions, filterType, filterStatus]);

  const clearFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
  };

  if (authLoading || (isLoadingSubmissions && user)) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Carregando painel...</p>
      </div>
    );
  }
  
  const officeUserId = user?.uid;

  const noFiltersApplied = filterType === 'all' && filterStatus === 'all';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-headline">
            Painel de Submissões Ativas
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe os orçamentos, serviços e check-ins não arquivados.
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

      <Card className="p-4 sm:p-6 shadow-md">
        <CardContent className="p-0 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <FilterIcon className="h-5 w-5 text-primary hidden sm:block" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full sm:flex-grow">
              <Select value={filterType} onValueChange={(value) => setFilterType(value as SubmissionType | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="quote">Orçamento</SelectItem>
                  <SelectItem value="finished">Serviço Finalizado</SelectItem>
                  <SelectItem value="checkin">Check-in</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'pending' | 'viewed' | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="viewed">Visualizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              onClick={clearFilters} 
              disabled={noFiltersApplied}
              className="w-full sm:w-auto"
            >
              <X className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredSubmissions.length === 0 && !isLoadingSubmissions && !isLoadingProfiles ? (
        <Alert>
          <ListChecks className="h-4 w-4" />
          <AlertTitle>{noFiltersApplied ? 'Nenhuma Submissão Ativa' : 'Nenhuma Submissão Encontrada'}</AlertTitle>
          <AlertDescription>
            {noFiltersApplied 
              ? "Ainda não há orçamentos, serviços ou check-ins ativos. Assim que forem registrados, eles aparecerão aqui."
              : "Nenhuma submissão corresponde aos filtros selecionados. Tente ajustá-los ou limpar os filtros."
            }
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {(isLoadingSubmissions || isLoadingProfiles) && filteredSubmissions.length === 0 && (
             <div className="flex justify-center items-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Carregando registros...</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubmissions.map((submission) => {
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
        </>
      )}
    </div>
  );
}
