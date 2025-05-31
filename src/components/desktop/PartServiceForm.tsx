"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image"; // Importar Image de next/image
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, UploadCloud } from "lucide-react";

interface PartServiceFormProps {
  onSubmit: (data: PartOrServiceFormData) => Promise<void>;
  initialData?: Partial<PartOrServiceFormData>;
  isSubmitting: boolean;
  submitButtonText?: string;
}

// Função para converter File para Data URI
const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Função para gerar URL de placeholder
const getDefaultPlaceholderUrl = (name: string) => `https://placehold.co/150x150.png?text=${name.substring(0,3) || 'Item'}`;


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

  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (initialData?.imageUrl) {
      setImagePreview(initialData.imageUrl);
    }
     // Revoke object URL on component unmount or when imagePreview changes to a non-object URL
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [initialData, imagePreview]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview); // Revoke old blob URL
      }
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      // If initialData had an image, revert to it, otherwise to null for placeholder logic
      setImagePreview(initialData?.imageUrl || null); 
    }
  };

  const handleFormSubmit = form.handleSubmit(async (dataFromForm) => {
    let submissionData = { ...dataFromForm };

    if (imageFile) {
      try {
        const dataUri = await fileToDataUri(imageFile);
        submissionData.imageUrl = dataUri;
      } catch (error) {
        console.error("Error converting file to Data URI:", error);
        form.setError("imageUrl", { type: "manual", message: "Erro ao processar a imagem." });
        return;
      }
    } else if (!submissionData.imageUrl && !initialData?.imageUrl) { 
      // If no new file, no existing image, and it's not an edit (or edit had no image)
      submissionData.imageUrl = getDefaultPlaceholderUrl(submissionData.name);
    }
    // If it's an edit and no new file is chosen, submissionData.imageUrl will retain its initial value from form.defaultValues

    await onSubmit(submissionData);
    
    // Reset form and image state only if it's not an edit (i.e., no initialData was provided)
    if (!initialData) {
      form.reset();
      setImageFile(null);
      setImagePreview(null);
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
        
        <FormItem>
          <FormLabel>Imagem do Item</FormLabel>
          <FormControl>
            <Input 
              type="file" 
              accept="image/png, image/jpeg, image/webp" 
              onChange={handleImageChange}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-primary/10 file:text-primary
                hover:file:bg-primary/20"
            />
          </FormControl>
          {imagePreview && (
            <div className="mt-4 relative w-32 h-32 border rounded-md overflow-hidden bg-muted">
              <Image src={imagePreview} alt="Pré-visualização" fill className="object-cover" />
            </div>
          )}
          {!imagePreview && (
             <div className="mt-4 flex items-center justify-center w-32 h-32 border-2 border-dashed rounded-md bg-muted/50 text-muted-foreground">
                <UploadCloud className="h-8 w-8" />
            </div>
          )}
          <FormDescription>
            Selecione uma imagem para o item (PNG, JPG, WEBP). Se nenhuma for selecionada, uma imagem placeholder será usada.
          </FormDescription>
          <FormMessage>{form.formState.errors.imageUrl?.message}</FormMessage>
        </FormItem>

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
                Palavras-chave para busca de imagem se um placeholder for usado (máx. 2 palavras).
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
