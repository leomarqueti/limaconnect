
"use client";

import { useEffect, useState, useTransition } from 'react';
import Image from 'next/image';
import { getPartsAndServices } from '@/lib/data';
import { createPartOrServiceAction, updatePartOrServiceAction, deletePartOrServiceAction } from '@/lib/actions';
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
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PartServiceForm } from '@/components/desktop/PartServiceForm';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Package, Wrench, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function InventoryManagementPage() {
  const [items, setItems] = useState<PartOrService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [editingItem, setEditingItem] = useState<PartOrService | null>(null);
  const [itemToDelete, setItemToDelete] = useState<PartOrService | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const currentItems = await getPartsAndServices();
      setItems(currentItems);
    } catch (error) {
      console.error("Failed to fetch inventory items:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar inventário",
        description: "Não foi possível buscar os itens do banco de dados.",
      });
      setItems([]); // Define como vazio em caso de erro
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleFormSubmit = async (data: PartOrServiceFormData) => {
    startSubmitTransition(async () => {
      const action = editingItem 
        ? updatePartOrServiceAction(editingItem.id, data) 
        : createPartOrServiceAction(data);
      
      const result = await action;

      if (result.success && result.item) {
        toast({
          title: editingItem ? "Item Atualizado!" : "Sucesso!",
          description: `"${result.item.name}" foi ${editingItem ? 'atualizado' : 'adicionado'} no inventário.`,
        });
        setIsFormOpen(false);
        setEditingItem(null);
        await fetchItems(); 
      } else {
        toast({
          variant: "destructive",
          title: `Erro ao ${editingItem ? 'atualizar' : 'adicionar'} item`,
          description: result.message || `Não foi possível ${editingItem ? 'atualizar' : 'adicionar'} o item.`,
        });
      }
    });
  };

  const handleOpenEditDialog = (item: PartOrService) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleOpenNewDialog = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };
  
  const handleOpenDeleteDialog = (item: PartOrService) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    startSubmitTransition(async () => {
      const result = await deletePartOrServiceAction(itemToDelete.id);
      if (result.success) {
        toast({
          title: "Item Excluído!",
          description: `"${itemToDelete.name}" foi removido do inventário.`,
        });
        await fetchItems(); 
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao excluir item",
          description: result.message || "Não foi possível excluir o item.",
        });
      }
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    });
  };

  if (isLoading && items.length === 0) {
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
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
          setIsFormOpen(isOpen);
          if (!isOpen) setEditingItem(null); 
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNewDialog}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar Item" : "Adicionar Novo Item ao Inventário"}</DialogTitle>
              <DialogDescription>
                {editingItem ? "Modifique os detalhes do item abaixo." : "Preencha os detalhes abaixo para adicionar uma nova peça ou serviço."}
              </DialogDescription>
            </DialogHeader>
            <PartServiceForm 
              onSubmit={handleFormSubmit} 
              initialData={editingItem || undefined}
              isSubmitting={isSubmitting}
              submitButtonText={editingItem ? "Salvar Alterações" : "Adicionar Item"}
              key={editingItem ? editingItem.id : 'new'} 
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
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" data-ai-hint={item.aiHint} sizes="50px"/>
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
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenEditDialog(item)} disabled={isSubmitting}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <AlertDialog open={isDeleteDialogOpen && itemToDelete?.id === item.id} onOpenChange={(isOpen) => {
                        if (!isOpen) {
                            setIsDeleteDialogOpen(false);
                            setItemToDelete(null);
                        }
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleOpenDeleteDialog(item)} disabled={isSubmitting}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza de que deseja excluir o item "{itemToDelete?.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => {
                            setIsDeleteDialogOpen(false);
                            setItemToDelete(null);
                          }} disabled={isSubmitting}>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteConfirm} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
                            {isSubmitting && itemToDelete?.id === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
