
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { partOrServiceSchema, type PartOrServiceFormData } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // Assuming you might want a description field later
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

interface PartServiceFormProps {
  onSubmit: (data: PartOrServiceFormData) => Promise<void>;
  initialData?: Partial<PartOrServiceFormData>;
  isSubmitting: boolean;
  submitButtonText?: string;
}

export function PartServiceForm({ 
  onSubmit, 
  initialData, 
  isSubmitting,
  submitButtonText = "Salvar Item" 
}: PartServiceFormProps) {
  const form = useForm<PartOrServiceFormData>({
    resolver: zodResolver(partOrServiceSchema),
    defaultValues: initialData || {
      name: "",
      price: 0.01,
      type: "part",
      imageUrl: "",
      aiHint: "",
    },
  });

  const handleFormSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
    if (!initialData) { // Reset form only if it's for creating a new item
      form.reset();
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Item</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Filtro de Ar" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="Ex: 25.50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="part">Peça</SelectItem>
                  <SelectItem value="service">Serviço</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Imagem (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="https://placehold.co/150x150.png" {...field} />
              </FormControl>
              <FormDescription>
                Se vazio, uma imagem placeholder será usada.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="aiHint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dica para IA da Imagem (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: oil filter" {...field} />
              </FormControl>
              <FormDescription>
                Palavras-chave para busca de imagem (máx. 2 palavras).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitButtonText}
        </Button>
      </form>
    </Form>
  );
}
