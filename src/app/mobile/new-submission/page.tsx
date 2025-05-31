
"use client";

import { useState, useEffect, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast'; // Added for potential notifications

export default function NewSubmissionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const submissionType = searchParams.get('type');
  const mechanicId = searchParams.get('mechanicId');

  const [isLoading, startTransition] = useTransition();
  // In a real app, you'd have state for selected items, quantities, etc.
  // For example: const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    if (!submissionType || !mechanicId) {
      toast({
        variant: "destructive",
        title: "Erro de Parâmetro",
        description: "Tipo de submissão ou ID do mecânico ausente.",
      });
      router.replace('/mobile'); // Redirect if params are missing
    }
  }, [submissionType, mechanicId, router, toast]);

  const handleSubmit = () => {
    startTransition(async () => {
      // Here you would call your server action to submit the job
      // e.g., const result = await submitJobAction(...);
      // For now, just a placeholder
      toast({
        title: "Submissão Enviada",
        description: "Seu registro foi enviado com sucesso.",
      });
      router.push('/mobile');
    });
  };

  if (!submissionType || !mechanicId) {
    // Render minimal UI or null while redirecting or if params are truly missing
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
            <Input id="customerName" placeholder="Ex: João Silva" />
          </div>
          <div>
            <Label htmlFor="vehicleInfo">Informações do Veículo (Opcional)</Label>
            <Input id="vehicleInfo" placeholder="Ex: VW Gol 2015 Placa ABC-1234" />
          </div>
          
          <div className="space-y-2">
            <Label>Peças e Serviços</Label>
            {/* Placeholder for part/service selection UI */}
            <div className="border rounded-md p-4 min-h-[200px] bg-muted/20">
              <p className="text-muted-foreground">
                Interface de seleção de peças e serviços aqui.
                Poderia usar um <code className="font-mono">ScrollArea</code> para listar itens.
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações Adicionais</Label>
            <textarea
              id="notes"
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Alguma observação sobre o serviço ou orçamento?"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Enviar Registro'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
