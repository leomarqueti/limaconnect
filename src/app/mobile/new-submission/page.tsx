
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
import { getPartsAndServices } from '@/lib/data';
import type { PartOrService, SelectedItem as SelectedItemType, SubmissionType } from '@/types';
import { PartServiceCard } from '@/components/shared/PartServiceCard';
import { Search, Plus, Minus, XCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { submitJobAction } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';

export default function NewSubmissionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const submissionType = searchParams.get('type');
  const mechanicId = searchParams.get('mechanicId');

  const [isLoading, startTransition] = useTransition();

  const [allPartsAndServices, setAllPartsAndServices] = useState<PartOrService[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemsMap, setSelectedItemsMap] = useState<Map<string, SelectedItemType>>(new Map());

  const [customerName, setCustomerName] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!submissionType || !mechanicId) {
      toast({
        variant: "destructive",
        title: "Erro de Parâmetro",
        description: "Tipo de submissão ou ID do mecânico ausente.",
      });
      router.replace('/mobile');
    }
    setAllPartsAndServices(getPartsAndServices());
  }, [submissionType, mechanicId, router, toast]);

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
        newMap.delete(item.id);
      } else {
        newMap.set(item.id, { item, quantity: 1 });
      }
      return newMap;
    });
  };

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

  const selectedItemsArray = useMemo(() => Array.from(selectedItemsMap.values()), [selectedItemsMap]);

  const totalPrice = useMemo(() => {
    return selectedItemsArray.reduce((total, { item, quantity }) => total + item.price * quantity, 0);
  }, [selectedItemsArray]);

  const handleSubmit = () => {
    startTransition(async () => {
      const selectedItemsData = selectedItemsArray.map(
        (selectedItem) => ({
          itemId: selectedItem.item.id,
          quantity: selectedItem.quantity,
        })
      );

      if (selectedItemsData.length === 0) {
        toast({
          variant: "destructive",
          title: "Nenhum item selecionado",
          description: "Por favor, adicione ao menos uma peça ou serviço.",
        });
        return;
      }

      const actionResult = await submitJobAction({
        mechanicId: mechanicId!,
        submissionType: submissionType as SubmissionType,
        selectedItemsData,
        customerName: customerName || undefined,
        vehicleInfo: vehicleInfo || undefined,
        notes: notes || undefined,
      });

      if (actionResult && actionResult.success === false) {
         toast({
            variant: "destructive",
            title: "Erro ao Enviar",
            description: actionResult.message || "Ocorreu um erro ao enviar o registro.",
        });
      }
    });
  };

  if (!submissionType || !mechanicId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Erro</CardTitle>
              <CardDescription>Parâmetros inválidos. Redirecionando...</CardDescription>
            </CardHeader>
          </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {submissionType === 'quote' ? 'Montar Orçamento' : 'Registrar Serviço Finalizado'}
          </CardTitle>
          <CardDescription>
            Mecânico: {mechanicId} | Preencha os detalhes abaixo.
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
            <ScrollArea className="h-[300px] rounded-md border p-2 bg-muted/20">
              {filteredPartsAndServices.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredPartsAndServices.map(item => (
                    <PartServiceCard
                      key={item.id}
                      item={item}
                      onSelect={() => handleSelectItem(item)}
                      isSelected={selectedItemsMap.has(item.id)}
                      showPrice={true}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-10">Nenhum item encontrado.</p>
              )}
            </ScrollArea>
          </div>

          {selectedItemsArray.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Itens Selecionados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedItemsArray.map(({ item, quantity }) => (
                  <div key={item.id} className="flex items-center justify-between space-x-2 p-3 border rounded-lg shadow-sm">
                    <div className="flex-grow">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">R$ {item.price.toFixed(2)} cada</p>
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
                    <p className="font-semibold w-20 text-right text-sm">R$ {(item.price * quantity).toFixed(2)}</p>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8 sm:h-9 sm:w-9" onClick={() => handleSelectItem(item)} aria-label={`Remover ${item.name}`}>
                       <XCircle className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
                <Separator className="my-4" />
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total:</span>
                  <span>R$ {totalPrice.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <Label htmlFor="notes">Observações Adicionais</Label>
            <Textarea
              id="notes"
              placeholder="Alguma observação sobre o serviço ou orçamento?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-6">
          <Button onClick={handleSubmit} disabled={isLoading} size="lg">
            {isLoading ? 'Enviando...' : 'Enviar Registro'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
