
"use client"; 

import Link from 'next/link';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'; // Added useRef
import { getSubmissions, getUserFromFirestore, safeTimestampToDate } from '@/lib/data';
import type { Submission, UserProfile, SubmissionType } from '@/types';
import { SubmissionCard } from '@/components/desktop/SubmissionCard';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ListChecks, PlusCircle, Loader2, Filter as FilterIcon, X, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { collection, query, where, orderBy, onSnapshot, Timestamp, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function DesktopDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userProfilesMap, setUserProfilesMap] = useState<Record<string, UserProfile | null>>({});
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  
  const initialLoadCompleteRef = useRef(false); // Usar ref para controlar o carregamento inicial
  const userProfilesMapRef = useRef<Record<string, UserProfile | null>>({}); // Ref para o estado atual do mapa de perfis

  const [filterType, setFilterType] = useState<SubmissionType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'pending' | 'viewed' | 'all'>('all');

  // Atualizar o ref sempre que userProfilesMap mudar
  useEffect(() => {
    userProfilesMapRef.current = userProfilesMap;
  }, [userProfilesMap]);


  useEffect(() => {
    if (authLoading || !user) {
      setIsLoadingSubmissions(false);
      setSubmissions([]);
      setUserProfilesMap({});
      initialLoadCompleteRef.current = false; // Resetar ref se usuário deslogar
      return;
    }

    setIsLoadingSubmissions(true);
    initialLoadCompleteRef.current = false; // Resetar para cada nova subscrição (ex: mudança de usuário)


    const q = query(
      collection(db, "submissions"),
      where("isArchived", "==", false),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const fetchedSubmissions: Submission[] = [];
      const profilesToLoadUids: Set<string> = new Set();

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as DocumentData;
        const submission: Submission = {
          id: docSnap.id,
          mechanicId: data.mechanicId || '',
          type: data.type || 'quote',
          timestamp: safeTimestampToDate(data.timestamp as Timestamp | Date | string),
          status: data.status || 'pending',
          isArchived: data.isArchived === true,
          items: data.type !== 'checkin' ? (Array.isArray(data.items) ? data.items : []) : undefined,
          totalPrice: data.type !== 'checkin' ? (typeof data.totalPrice === 'number' ? data.totalPrice : 0) : undefined,
          customerName: data.customerName || undefined,
          vehicleInfo: data.vehicleInfo || undefined,
          notes: data.notes || undefined,
          customerContact: data.type === 'checkin' ? (data.customerContact || undefined) : undefined,
          vehicleMake: data.type === 'checkin' ? (data.vehicleMake || undefined) : undefined,
          vehicleModel: data.type === 'checkin' ? (data.vehicleModel || undefined) : undefined,
          vehicleYear: data.type === 'checkin' ? (data.vehicleYear || undefined) : undefined,
          vehicleVIN: data.type === 'checkin' ? (data.vehicleVIN || undefined) : undefined,
          vehicleLicensePlate: data.type === 'checkin' ? (data.vehicleLicensePlate || undefined) : undefined,
          serviceRequestDetails: data.type === 'checkin' ? (data.serviceRequestDetails || undefined) : undefined,
          checklistItems: data.type === 'checkin' ? (Array.isArray(data.checklistItems) ? data.checklistItems : []) : undefined,
          photoDataUris: data.type === 'checkin' ? (Array.isArray(data.photoDataUris) ? data.photoDataUris : []) : undefined,
        };
        fetchedSubmissions.push(submission);
        if (submission.mechanicId) {
          profilesToLoadUids.add(submission.mechanicId);
        }
      });

      setSubmissions(fetchedSubmissions);

      // Fetch profiles for new mechanic IDs without causing useEffect loop
      const currentProfiles = userProfilesMapRef.current;
      const uidsToFetchActually: string[] = [];
      profilesToLoadUids.forEach(uid => {
        if (!currentProfiles[uid]) {
          uidsToFetchActually.push(uid);
        }
      });

      if (uidsToFetchActually.length > 0) {
        const profilePromises = uidsToFetchActually.map(uid => getUserFromFirestore(uid));
        const resolvedProfiles = await Promise.all(profilePromises);
        setUserProfilesMap(prevMap => {
          const newMapUpdates: Record<string, UserProfile | null> = {};
          resolvedProfiles.forEach((profile, index) => {
            if (profile) {
              newMapUpdates[uidsToFetchActually[index]] = profile;
            }
          });
          return { ...prevMap, ...newMapUpdates };
        });
      }
      
      if (initialLoadCompleteRef.current) {
        querySnapshot.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const newSubmissionData = change.doc.data();
            // Check if this submission is already in our state (onSnapshot can sometimes re-fire for existing docs on initial connection)
             const isTrulyNew = !submissions.some(s => s.id === change.doc.id);

            if (isTrulyNew && newSubmissionData.status === 'pending' && newSubmissionData.isArchived === false) {
              let submitterProfile = userProfilesMapRef.current[newSubmissionData.mechanicId];
              if (!submitterProfile && newSubmissionData.mechanicId) {
                  submitterProfile = await getUserFromFirestore(newSubmissionData.mechanicId);
                  if (submitterProfile) {
                      setUserProfilesMap(prev => ({ ...prev, [newSubmissionData.mechanicId]: submitterProfile }));
                  }
              }

              let submitterName = `ID: ${newSubmissionData.mechanicId.substring(0,5)}...`;
               if (newSubmissionData.mechanicId === 'office_user') {
                  submitterName = 'Escritório';
              } else if (newSubmissionData.mechanicId === 'tablet_user') {
                  submitterName = 'Recepção (Tablet)';
              } else if (submitterProfile) {
                  submitterName = submitterProfile.displayName || submitterProfile.email || submitterName;
              }

              toast({
                title: `🔔 Nova Submissão: ${newSubmissionData.type}`,
                description: `De: ${submitterName}. Cliente: ${newSubmissionData.customerName || 'N/A'}. Veículo: ${newSubmissionData.vehicleInfo || newSubmissionData.vehicleModel || 'N/A'}`,
                duration: 15000,
              });
            }
          }
        });
      } else {
        initialLoadCompleteRef.current = true;
      }
      setIsLoadingSubmissions(false);
    }, (error) => {
      console.error("Erro ao buscar submissões com onSnapshot:", error);
      if (error.message.includes("query requires an index") || error.message.includes("needs an index")) {
        toast({
          variant: "destructive",
          title: "Índice Necessário no Firestore",
          description: "A consulta para submissões em tempo real requer um índice. Verifique o console do Firebase para o link de criação.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao Carregar Submissões",
          description: "Não foi possível buscar os registros.",
        });
      }
      setIsLoadingSubmissions(false);
      initialLoadCompleteRef.current = true; 
    });

    return () => {
      unsubscribe();
      initialLoadCompleteRef.current = false; 
    };
  }, [user, authLoading, toast]); // REMOVIDO: fetchProfileIfNotExists, initialLoadComplete, userProfilesMap


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

  if (authLoading || (isLoadingSubmissions && !initialLoadCompleteRef.current && user)) {
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

      {filteredSubmissions.length === 0 && !isLoadingSubmissions ? (
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
          {isLoadingSubmissions && !initialLoadCompleteRef.current && ( // Usar ref para condição de loading
             <div className="flex justify-center items-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Carregando registros...</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubmissions.map((submission) => {
              const submitterProfile = userProfilesMap[submission.mechanicId]; // Ler do estado para renderização
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
