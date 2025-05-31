
"use client";

import { useState, useTransition, useEffect, useRef } from 'react'; // Added useEffect, useRef
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Keep if used outside RHF, otherwise FormLabel is preferred
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"; // Added FormDescription
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Loader2, Camera, Trash2, Car, UserCircle, ClipboardList, AlertCircle } from 'lucide-react';
import type { CheckinFormData, ChecklistItemValue } from '@/types';
import { checkinFormSchema } from '@/types';
import { submitCheckinAction } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const initialChecklistItems: ChecklistItemValue[] = [
  { id: 'mileage', label: 'Quilometragem Atual', value: '', type: 'text', notes: '' },
  { id: 'fuel_level', label: 'Nível de Combustível', value: '', type: 'text', notes: '' },
  { id: 'exterior_lights', label: 'Luzes Externas Funcionando?', value: false, type: 'boolean', notes: '' },
  { id: 'tire_condition', label: 'Condição dos Pneus (visual)', value: '', type: 'text', notes: 'Ex: Bom, Razoável, Desgastado' },
  { id: 'dashboard_warnings', label: 'Luzes de Advertência no Painel?', value: false, type: 'boolean', notes: '' },
  { id: 'has_spare_tire', label: 'Estepe Presente?', value: false, type: 'boolean', notes: '' },
  { id: 'has_jack_tools', label: 'Macaco e Ferramentas Presentes?', value: false, type: 'boolean', notes: '' },
  { id: 'exterior_damage_notes', label: 'Observações de Avarias Externas', value: '', type: 'textarea', notes: 'Descreva arranhões, amassados etc.' },
  { id: 'interior_condition_notes', label: 'Observações do Interior', value: '', type: 'textarea', notes: 'Limpeza, rasgados, etc.' },
];


export default function TabletCheckinPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoDataUris, setPhotoDataUris] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItemValue[]>(initialChecklistItems);
  const photoInputRef = useRef<HTMLInputElement>(null); // Ref for file input

  const form = useForm<CheckinFormData>({
    resolver: zodResolver(checkinFormSchema),
    defaultValues: {
      customerName: '',
      customerContact: '',
      vehicleMake: '',
      vehicleModel: '',
      vehicleYear: '',
      vehicleLicensePlate: '',
      vehicleVIN: '',
      serviceRequestDetails: '',
    },
  });

  // Clean up preview URLs when component unmounts or previews change
  useEffect(() => {
    return () => {
      photoPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const currentPreviews = [...photoPreviews];
      const currentDataUris = [...photoDataUris];
      
      const newLocalPreviews: string[] = [];
      const newDataUrisPromises: Promise<string>[] = [];

      Array.from(files).forEach(file => {
        newLocalPreviews.push(URL.createObjectURL(file));
        newDataUrisPromises.push(
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error('Falha ao ler o arquivo como Data URI.'));
              }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
          })
        );
      });

      setPhotoPreviews(prev => [...prev, ...newLocalPreviews]);

      try {
        const resolvedNewDataUris = await Promise.all(newDataUrisPromises);
        setPhotoDataUris(prev => [...prev, ...resolvedNewDataUris]);
      } catch (error) {
        console.error("Erro ao ler arquivos para Data URI:", error);
        toast({
          variant: "destructive",
          title: "Erro ao Carregar Imagem",
          description: "Uma ou mais imagens não puderam ser carregadas. Por favor, tente novamente.",
        });
        // Optionally, remove previews if their corresponding data URI failed.
        // This could be complex to map back, so for now, we'll leave previews as is.
      }
    }
     // Reset file input to allow re-selection of the same file(s)
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };


  const removePhoto = (index: number) => {
    // Revoke the object URL for the preview being removed
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    setPhotoDataUris(prev => prev.filter((_, i) => i !== index));
  };

  const handleChecklistItemChange = (index: number, field: keyof ChecklistItemValue, value: string | boolean) => {
    setChecklist(prev => {
      const updated = [...prev];
      // @ts-ignore
      updated[index][field] = value;
      return updated;
    });
  };

  const onSubmit = async (data: CheckinFormData) => {
    startSubmitTransition(async () => {
      const result = await submitCheckinAction({
        ...data,
        checklistItems: checklist,
        photoDataUris: photoDataUris,
      });

      if (result.success) {
        toast({
          title: "Check-in Realizado!",
          description: "Os dados do veículo e cliente foram enviados para o escritório.",
        });
        form.reset();
        setPhotoPreviews([]); // Old previews are revoked by useEffect cleanup
        setPhotoDataUris([]);
        setChecklist(JSON.parse(JSON.stringify(initialChecklistItems))); // Deep copy to reset checklist
        if (photoInputRef.current) { // Clear file input
            photoInputRef.current.value = "";
        }
        // router.push('/'); // Or a success page for tablet? For now, just reset.
      } else {
        toast({
          variant: "destructive",
          title: "Erro no Check-in",
          description: result.message || "Não foi possível enviar os dados. Tente novamente.",
        });
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto pb-8"> {/* Added pb-8 for spacing */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <Car className="mr-3 h-7 w-7 text-primary" /> Check-in de Veículo
          </CardTitle>
          <CardDescription>
            Preencha os dados abaixo para registrar a entrada do veículo na oficina.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-8">
              
              <section className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center"><UserCircle className="mr-2 h-5 w-5 text-primary" />Informações do Cliente</h3>
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl><Input placeholder="Nome do cliente" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contato (Telefone/Email)</FormLabel>
                      <FormControl><Input placeholder="Telefone ou email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <Separator />

              <section className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center"><Car className="mr-2 h-5 w-5 text-primary" />Informações do Veículo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="vehicleMake" render={({ field }) => ( <FormItem><FormLabel>Marca</FormLabel><FormControl><Input placeholder="Ex: Volkswagen" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="vehicleModel" render={({ field }) => ( <FormItem><FormLabel>Modelo</FormLabel><FormControl><Input placeholder="Ex: Gol" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="vehicleYear" render={({ field }) => ( <FormItem><FormLabel>Ano</FormLabel><FormControl><Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Ex: 2015" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="vehicleLicensePlate" render={({ field }) => ( <FormItem><FormLabel>Placa</FormLabel><FormControl><Input placeholder="Ex: BRA2E19" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField control={form.control} name="vehicleVIN" render={({ field }) => ( <FormItem><FormLabel>Chassi (VIN)</FormLabel><FormControl><Input placeholder="17 caracteres" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </section>

              <Separator />
              
              <section className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center"><ClipboardList className="mr-2 h-5 w-5 text-primary" />Solicitação de Serviço / Problema</h3>
                <FormField
                  control={form.control}
                  name="serviceRequestDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição do Cliente</FormLabel>
                      <FormControl><Textarea rows={4} placeholder="Descreva o problema relatado pelo cliente ou o serviço solicitado..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <Separator />

              <section className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center"><ClipboardList className="mr-2 h-5 w-5 text-primary" />Checklist de Entrada</h3>
                {checklist.map((item, index) => (
                  <Card key={item.id} className="p-4 bg-muted/30 shadow-sm">
                    <FormLabel htmlFor={item.id} className="font-medium">{item.label}</FormLabel>
                    {item.type === 'text' && (
                      <Input
                        id={item.id}
                        value={item.value as string}
                        onChange={(e) => handleChecklistItemChange(index, 'value', e.target.value)}
                        placeholder={item.notes || `Detalhes sobre ${item.label.toLowerCase()}`}
                        className="mt-1"
                      />
                    )}
                    {item.type === 'textarea' && (
                       <Textarea
                        id={item.id}
                        value={item.value as string}
                        onChange={(e) => handleChecklistItemChange(index, 'value', e.target.value)}
                        placeholder={item.notes || `Observações detalhadas sobre ${item.label.toLowerCase()}`}
                        className="mt-1"
                        rows={3}
                      />
                    )}
                    {item.type === 'boolean' && (
                      <div className="flex items-center space-x-3 mt-2 py-2">
                        <Checkbox
                          id={item.id}
                          checked={item.value as boolean}
                          onCheckedChange={(checked) => handleChecklistItemChange(index, 'value', !!checked)}
                        />
                        <label htmlFor={item.id} className="text-sm text-muted-foreground cursor-pointer select-none">
                          {item.label} {item.value ? "(Sim)" : "(Não)"}
                        </label>
                      </div>
                    )}
                     { (item.type === 'boolean' && item.value === true && (item.id === 'exterior_lights' || item.id === 'dashboard_warnings')) || 
                       (item.id === 'tire_condition' && (item.value as string)?.toLowerCase() !== 'bom' && item.value !== '') ||
                       (item.id === 'exterior_damage_notes' || item.id === 'interior_condition_notes' ) // Keep notes field always visible for textarea type
                     ? (
                        <Input
                          id={`${item.id}_notes_detail`} // Changed id to avoid conflict with main input/checkbox
                          value={checklist[index].notes || ''}
                          onChange={(e) => handleChecklistItemChange(index, 'notes', e.target.value)}
                          placeholder={`Observações para ${item.label.toLowerCase()}...`}
                          className="mt-2 text-sm"
                        />
                    ) : (item.type === 'boolean' && item.notes) ? ( // Show notes if boolean but no specific condition met but notes field is not empty (e.g. manually set for other booleans)
                       <p className="text-xs text-muted-foreground mt-1"><em>Obs: {item.notes}</em></p>
                    ) : null}

                    {item.type !== 'textarea' && item.type !== 'text' && item.notes && !( (item.type === 'boolean' && item.value === true && (item.id === 'exterior_lights' || item.id === 'dashboard_warnings')) || (item.id === 'tire_condition' && (item.value as string)?.toLowerCase() !== 'bom' && item.value !== '') ) && (
                        <p className="text-xs text-muted-foreground mt-1"><em>Guia: {item.notes}</em></p>
                    )}
                  </Card>
                ))}
              </section>

              <Separator />

              <section className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center"><Camera className="mr-2 h-5 w-5 text-primary" />Fotos do Veículo</h3>
                <FormField
                  name="photos" // Not directly used by RHF schema, but good for context
                  control={form.control} // Added control for RHF context
                  render={() => ( // Used render prop
                    <FormItem>
                      <FormLabel htmlFor="photo-upload" className="sr-only">Upload de fotos</FormLabel>
                      <FormControl>
                        <Input 
                          id="photo-upload" 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          onChange={handlePhotoChange}
                          ref={photoInputRef} // Assign ref
                          className="block w-full text-sm text-slate-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-primary/10 file:text-primary
                            hover:file:bg-primary/20
                            cursor-pointer"
                        />
                      </FormControl>
                      <FormDescription className="mt-1">
                        Selecione uma ou mais fotos do veículo (arranhões, painel, etc.). Máximo 5MB por foto.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {photoPreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                    {photoPreviews.map((previewUrl, index) => (
                      <div key={index} className="relative group aspect-video sm:aspect-square"> {/* Changed to aspect-video for wider tablet view */}
                        <Image src={previewUrl} alt={`Preview ${index + 1}`} fill className="rounded-md object-contain border bg-muted" /> {/* Changed to object-contain */}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          onClick={() => removePhoto(index)}
                          aria-label="Remover foto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                 {photoPreviews.length === 0 && (
                    <Alert variant="default" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Nenhuma Foto Adicionada</AlertTitle>
                        <AlertDescription>
                        Considere adicionar fotos para documentar o estado do veículo na entrada. Clique no botão acima para selecionar.
                        </AlertDescription>
                    </Alert>
                )}
              </section>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? "Enviando Check-in..." : "Registrar Entrada e Enviar"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

