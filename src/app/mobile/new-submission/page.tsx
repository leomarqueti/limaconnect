
"use client";

import { useState, useEffect, useTransition, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getPartsAndServices, getMechanicById } from '@/lib/data';
import type { PartOrService, SelectedItem as SelectedItemType, SubmissionType, Mechanic } from '@/types';
import { PartServiceCard } from '@/components/shared/PartServiceCard';
import { Search, Plus, Minus, XCircle, Loader2, Lightbulb, ArrowLeft } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { submitJobAction, getAiSuggestionsAction } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';


export default function NewSubmissionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const submissionTypeParam = searchParams.get('type');
  const submissionType: Extract<SubmissionType, 'quote' | 'finished'> | null =
    (submissionTypeParam === 'quote' || submissionTypeParam === 'finished')
    ? submissionTypeParam
    : null;
  
  // const mechanicId = searchParams.get('mechanicId'); // Will be replaced by logged-in user
  const mechanicId = user?.uid; // Use logged-in user's ID

  const [isSubmitting, startSubmitTransition] = useTransition();
  const [isFetchingSuggestions, startFetchingSuggestionsTransition] = useTransition();
  const [isFetchingInventory, setIsFetchingInventory] = useState(true);

  const [allPartsAndServices, setAllPartsAndServices] = useState<PartOrService[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemsMap, setSelectedItemsMap] = useState<Map<string, SelectedItemType>>(new Map());
  const [aiSuggestions, setAiSuggestions] = useState<PartOrService[]>([]);
  const [mechanicProfile, setMechanicProfile] = useState<UserProfile | null | undefined>(null);

  const [customerName, setCustomerName] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!submissionType) { // Removed mechanicId from this check as it's now from auth user
      toast({
        variant: "destructive",
        title: "Erro de Parâmetro",
        description: `Tipo de submissão '${submissionTypeParam || 'ausente'}' inválido. Redirecionando...`,
      });
      router.replace('/mobile');
      return;
    }
    if (!mechanicId) { // Explicitly check if mechanicId (from auth) is available
        toast({
            variant: "destructive",
            title: "Usuário não autenticado",
            description: "Você precisa estar logado para criar uma submissão. Redirecionando...",
        });
        router.replace('/login?origin=mobile/new-submission'); // Or just /mobile
        return;
    }


    const fetchInventory = async () => {
      setIsFetchingInventory(true);
      try {
        const parts = await getPartsAndServices();
        setAllPartsAndServices(parts);
      } catch (error) {
        console.error("Failed to fetch inventory for mobile submission:", error);
        toast({
          variant: "destructive",
          title: "Erro ao Carregar Itens",
          description: "Não foi possível buscar o inventário.",
        });
        setAllPartsAndServices([]);
      } finally {
        setIsFetchingInventory(false);
      }
    };
    fetchInventory();
    if (user?.profile) {
        setMechanicProfile(user.profile);
    }

  }, [submissionType, mechanicId, router, toast, submissionTypeParam, user]);

  const selectedItemsArray = useMemo(() => Array.from(selectedItemsMap.values()), [selectedItemsMap]);

  useEffect(() => {
    if (selectedItemsArray.length > 0 && allPartsAndServices.length > 0) { 
      startFetchingSuggestionsTransition(async () => {
        const currentSelectionNames = selectedItemsArray.map(si => si.item.name);
        const suggestions = await getAiSuggestionsAction(currentSelectionNames);
        setAiSuggestions(suggestions.filter(sugg => 
          !selectedItemsMap.has(sugg.id) && allPartsAndServices.some(invItem => invItem.id === sugg.id)
        ));
      });
    } else {
      setAiSuggestions([]);
    }
  }, [selectedItemsMap, selectedItemsArray, allPartsAndServices]);


  const filteredPartsAndServices = useMemo(() => {
    if (!searchTerm) return allPartsAndServices;
    return allPartsAndServices.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allPartsAndServices, searchTerm]);

  const handleSelectItem = (item: PartOrService) => {
    setSelectedItemsMap(prevMap => {
      const newMap = new Map(prevMap);
      if (newMap.has(item.id)) {
      } else {
        newMap.set(item.id, { item, quantity: 1 });
      }
      setAiSuggestions(prevSuggestions => prevSuggestions.filter(sugg => sugg.id !== item.id));
      return newMap;
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItemsMap(prevMap => {
      const newMap = new Map(prevMap);
      newMap.delete(itemId);
      return newMap;
    })
  }

  const handleQuantityChange = (itemId: string, change: number) => {
    setSelectedItemsMap(prevMap => {
      const newMap = new Map(prevMap);
      const currentItem = newMap.get(itemId);
      if (currentItem) {
        const newQuantity = currentItem.quantity + change;
        if (newQuantity <= 0) {
          newMap.delete(itemId);
        } else {
          newMap.set(itemId, { ...currentItem, quantity: newQuantity });
        }
      }
      return newMap;
    });
  };

  const handleSubmit = () => {
    if (!mechanicId || !submissionType) {
      toast({ variant: "destructive", title: "Erro", description: "ID do mecânico ou tipo de submissão inválido." });
      return;
    }

    startSubmitTransition(async () => {
      const selectedItemsData = selectedItemsArray.map(
        (selectedItem) => ({
          itemId: selectedItem.item.id,
          quantity: selectedItem.quantity,
        })
      );

      if (selectedItemsData.length === 0 && submissionType === 'finished') {
        toast({
          variant: "destructive",
          title: "Nenhum item selecionado",
          description: "Para registrar um serviço finalizado, adicione ao menos uma peça ou serviço.",
        });
        return;
      }
       if (selectedItemsData.length === 0 && submissionType === 'quote' && !notes && !customerName && !vehicleInfo ) {
        toast({
          variant: "destructive",
          title: "Orçamento Vazio",
          description: "Para um orçamento, adicione itens ou preencha cliente, veículo ou observações.",
        });
        return;
      }

      const actionResult = await submitJobAction({
        mechanicId: mechanicId,
        submissionType: submissionType,
        selectedItemsData,
        customerName: customerName || undefined,
        vehicleInfo: vehicleInfo || undefined,
        notes: notes || undefined,
      });

      if (actionResult.success) {
        toast({
          title: "Sucesso!",
          description: `Registro de ${submissionType === 'quote' ? 'orçamento' : 'serviço'} enviado.`,
        });
        router.push('/mobile');
      } else {
         toast({
            variant: "destructive",
            title: "Erro ao Enviar",
            description: actionResult.message || "Ocorreu um erro ao enviar o registro.",
        });
      }
    });
  };

  if (!submissionType || !mechanicId) { // Checks if essential params/auth data are missing
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Carregando...</CardTitle>
              <CardDescription>Verificando informações...</CardDescription>
            </CardHeader>
             <CardFooter>
                <Button variant="outline" asChild>
                    <Link href="/mobile"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link>
                </Button>
            </CardFooter>
          </Card>
      </div>
    );
  }

  if (isFetchingInventory) {
     return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Carregando itens...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
       <Button variant="outline" asChild className="mb-6 group sm:hidden">
        <Link href="/mobile">
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar
        </Link>
      </Button>
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline">
            {submissionType === 'quote' ? 'Montar Orçamento' : 'Registrar Serviço Finalizado'}
          </CardTitle>
          <CardDescription>
            Registrando como: {mechanicProfile?.displayName || mechanicId}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="customerName">Nome do Cliente (Opcional)</Label>
            <Input id="customerName" placeholder="Ex: João Silva" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="vehicleInfo">Informações do Veículo (Opcional)</Label>
            <Input id="vehicleInfo" placeholder="Ex: VW Gol 2015 Placa ABC-1234" value={vehicleInfo} onChange={(e) => setVehicleInfo(e.target.value)} />
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg font-medium">Peças e Serviços</Label>
            <div className="relative">
              <Input
                type="search"
                placeholder="Buscar peças ou serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-base"
              />
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <ScrollArea className="h-[250px] rounded-md border p-2 bg-muted/20">
              {filteredPartsAndServices.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredPartsAndServices.map(item => (
                    <PartServiceCard
                      key={item.id}
                      item={item}
                      onSelect={() => handleSelectItem(item)}
                      isSelected={selectedItemsMap.has(item.id)}
                      showPrice={false} 
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-10">Nenhum item encontrado.</p>
              )}
            </ScrollArea>
          </div>

          {aiSuggestions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-md font-semibold flex items-center text-primary">
                <Lightbulb className="h-5 w-5 mr-2" />
                Sugestões para você
                {isFetchingSuggestions && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              </h3>
              <ScrollArea className="h-[130px] -mx-2 px-2">
                <div className="flex space-x-3 pb-2">
                  {aiSuggestions.map(item => (
                     <div key={item.id} className="w-32 flex-shrink-0 sm:w-36">
                        <PartServiceCard
                          item={item}
                          onSelect={() => handleSelectItem(item)}
                          isSelected={selectedItemsMap.has(item.id)}
                          showPrice={false}
                        />
                      </div>
                  ))}
                </div>
              </ScrollArea>
               <Separator />
            </div>
          )}


          {selectedItemsArray.length > 0 && (
            <Card className="bg-background shadow-inner">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-lg">Itens Selecionados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[200px] overflow-y-auto">
                {selectedItemsArray.map(({ item, quantity }) => (
                  <div key={item.id} className="flex items-center justify-between space-x-2 p-2 border rounded-lg shadow-sm bg-card">
                    <div className="flex-grow">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.type === 'part' ? 'Peça' : 'Serviço'}</p>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => handleQuantityChange(item.id, -1)} aria-label={`Diminuir quantidade de ${item.name}`}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center font-medium">{quantity}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => handleQuantityChange(item.id, 1)} aria-label={`Aumentar quantidade de ${item.name}`}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8 sm:h-9 sm:w-9" onClick={() => handleRemoveItem(item.id)} aria-label={`Remover ${item.name}`}>
                       <XCircle className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div>
            <Label htmlFor="notes">Observações Adicionais (Opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Alguma observação sobre o serviço ou orçamento?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-6 border-t">
          <Button onClick={handleSubmit} disabled={isSubmitting || isFetchingSuggestions || isFetchingInventory} size="lg" className="min-w-[150px]">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'Enviando...' : 'Enviar Registro'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
