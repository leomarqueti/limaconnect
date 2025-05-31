
"use client";

import { useEffect, useState, useTransition } from 'react';
import Image from 'next/image';
import { getPartsAndServices } from '@/lib/data';
import { createPartOrServiceAction } from '@/lib/actions';
import type { PartOrService, PartOrServiceFormData } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { PartServiceForm } from '@/components/desktop/PartServiceForm';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Package, Wrench, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function InventoryManagementPage() {
  const [items, setItems] = useState<PartOrService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    // No need to call getPartsAndServices directly if actions revalidate correctly
    // Forcing a re-fetch here for now to ensure fresh data on initial load / navigation
    const currentItems = getPartsAndServices();
    setItems(currentItems);
    setIsLoading(false);
  }, []); // Empty dependency means this runs on mount

  // This effect will run when items state is updated after revalidation from action
   useEffect(() => {
    const currentItems = getPartsAndServices();
    setItems(currentItems);
  }, [isSubmitting]); // Re-fetch when submission status changes


  const handleAddNewItem = async (data: PartOrServiceFormData) => {
    startSubmitTransition(async () => {
      const result = await createPartOrServiceAction(data);
      if (result.success && result.item) {
        // setItems(prevItems => [...prevItems, result.item!].sort((a,b) => a.name.localeCompare(b.name))); // Optimistic update
        toast({
          title: "Sucesso!",
          description: `"${result.item.name}" foi adicionado ao inventário.`,
        });
        setIsFormOpen(false); // Close dialog
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao adicionar item",
          description: result.message || "Não foi possível adicionar o item.",
        });
      }
    });
  };
  
  // TODO: Implement edit and delete handlers

  if (isLoading && items.length === 0) { // Show loader only if initial load is happening AND no items yet
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Carregando inventário...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-headline">
            Gerenciamento de Inventário
          </h1>
          <p className="text-muted-foreground mt-1">
            Adicione, edite ou remova peças e serviços.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Item ao Inventário</DialogTitle>
              <DialogDescription>
                Preencha os detalhes abaixo para adicionar uma nova peça ou serviço.
              </DialogDescription>
            </DialogHeader>
            <PartServiceForm 
              onSubmit={handleAddNewItem} 
              isSubmitting={isSubmitting}
              submitButtonText="Adicionar Item"
            />
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 && !isLoading ? (
         <p className="text-center text-muted-foreground py-8">Nenhum item no inventário. Clique em "Adicionar Novo Item" para começar.</p>
      ) : (
        <div className="border rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] hidden sm:table-cell">Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="w-[120px] text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="hidden sm:table-cell p-2">
                    <div className="relative h-12 w-12 rounded-md overflow-hidden border bg-muted">
                      <Image src={item.imageUrl} alt={item.name} fill objectFit="cover" data-ai-hint={item.aiHint} sizes="50px"/>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant={item.type === 'part' ? 'secondary' : 'outline'}>
                      {item.type === 'part' ? <Package className="h-3 w-3 mr-1.5" /> : <Wrench className="h-3 w-3 mr-1.5" />}
                      {item.type === 'part' ? 'Peça' : 'Serviço'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">R$ {item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-center space-x-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled> {/* TODO: Implement Edit */}
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="destructive" size="icon" className="h-8 w-8" disabled> {/* TODO: Implement Delete */}
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
