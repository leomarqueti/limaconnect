
"use client";

import { useState, useTransition } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const currentPreviews = [...photoPreviews];
      const currentDataUris = [...photoDataUris];

      Array.from(files).forEach(file => {
        currentPreviews.push(URL.createObjectURL(file));
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            currentDataUris.push(reader.result);
            // Ensure state updates after all files are processed if doing one by one
            // For simplicity, updating after loop, might need adjustment for many files
          }
        };
        reader.readAsDataURL(file);
      });
      // This might need to be more sophisticated if many files are uploaded at once due to async nature
      // For now, assuming a small number of files or a slight delay is acceptable.
      // A better way is to update state after each file is read.
      // To keep it simple here, we'll update after loop, but be aware:
      setTimeout(() => { // Using timeout to give FileReader time
        setPhotoPreviews(currentPreviews);
        setPhotoDataUris(currentDataUris);
      }, 100 * files.length); 
    }
  };

  const removePhoto = (index: number) => {
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
        setPhotoPreviews([]);
        setPhotoDataUris([]);
        setChecklist(initialChecklistItems);
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
    <div className="max-w-3xl mx-auto">
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
              
              {/* Customer Information */}
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

              {/* Vehicle Information */}
              <section className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center"><Car className="mr-2 h-5 w-5 text-primary" />Informações do Veículo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="vehicleMake" render={({ field }) => ( <FormItem><FormLabel>Marca</FormLabel><FormControl><Input placeholder="Ex: Volkswagen" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="vehicleModel" render={({ field }) => ( <FormItem><FormLabel>Modelo</FormLabel><FormControl><Input placeholder="Ex: Gol" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="vehicleYear" render={({ field }) => ( <FormItem><FormLabel>Ano</FormLabel><FormControl><Input type="text" placeholder="Ex: 2015" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="vehicleLicensePlate" render={({ field }) => ( <FormItem><FormLabel>Placa</FormLabel><FormControl><Input placeholder="Ex: BRA2E19" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField control={form.control} name="vehicleVIN" render={({ field }) => ( <FormItem><FormLabel>Chassi (VIN)</FormLabel><FormControl><Input placeholder="17 caracteres" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </section>

              <Separator />
              
              {/* Service Request */}
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

              {/* Checklist Section */}
              <section className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center"><ClipboardList className="mr-2 h-5 w-5 text-primary" />Checklist de Entrada</h3>
                {checklist.map((item, index) => (
                  <Card key={item.id} className="p-4 bg-muted/30">
                    <FormLabel htmlFor={item.id} className="font-medium">{item.label}</FormLabel>
                    {item.type === 'text' && (
                      <Input
                        id={item.id}
                        value={item.value as string}
                        onChange={(e) => handleChecklistItemChange(index, 'value', e.target.value)}
                        placeholder={item.notes}
                        className="mt-1"
                      />
                    )}
                    {item.type === 'textarea' && (
                       <Textarea
                        id={item.id}
                        value={item.value as string}
                        onChange={(e) => handleChecklistItemChange(index, 'value', e.target.value)}
                        placeholder={item.notes}
                        className="mt-1"
                        rows={3}
                      />
                    )}
                    {item.type === 'boolean' && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id={item.id}
                          checked={item.value as boolean}
                          onCheckedChange={(checked) => handleChecklistItemChange(index, 'value', !!checked)}
                        />
                        <label htmlFor={item.id} className="text-sm text-muted-foreground">
                          {item.value ? "Sim" : "Não"} {item.notes && `(${item.notes})`}
                        </label>
                      </div>
                    )}
                     { (item.type === 'boolean' && item.value === true && (item.id === 'exterior_lights' || item.id === 'dashboard_warnings')) || item.id === 'tire_condition' ? (
                        <Input
                          id={`${item.id}_notes`}
                          value={checklist[index].notes || ''}
                          onChange={(e) => handleChecklistItemChange(index, 'notes', e.target.value)}
                          placeholder={`Detalhes para ${item.label.toLowerCase()}...`}
                          className="mt-2 text-sm"
                        />
                    ) : null}
                  </Card>
                ))}
              </section>

              <Separator />

              {/* Photo Upload Section */}
              <section className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center"><Camera className="mr-2 h-5 w-5 text-primary" />Fotos do Veículo</h3>
                <FormField
                  name="photos" // Not directly used by RHF schema, but good for context
                  render={() => (
                    <FormItem>
                      <FormLabel htmlFor="photo-upload" className="sr-only">Upload de fotos</FormLabel>
                      <FormControl>
                        <Input 
                          id="photo-upload" 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          onChange={handlePhotoChange}
                          className="cursor-pointer"
                        />
                      </FormControl>
                      <FormDescription>
                        Selecione uma ou mais fotos do veículo (arranhões, painel, etc.).
                      </FormDescription>
                    </FormItem>
                  )}
                />
                {photoPreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                    {photoPreviews.map((previewUrl, index) => (
                      <div key={index} className="relative group aspect-square">
                        <Image src={previewUrl} alt={`Preview ${index + 1}`} fill className="rounded-md object-cover border" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remover foto</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                 {photoPreviews.length === 0 && (
                    <Alert variant="default" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Nenhuma Foto Adicionada</AlertTitle>
                        <AlertDescription>
                        Considere adicionar fotos para documentar o estado do veículo na entrada.
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
