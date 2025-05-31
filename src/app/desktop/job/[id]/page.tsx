
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getSubmissionById, getMechanicById } from '@/lib/data';
import { markSubmissionAsViewedAction } from '@/lib/actions';
import type { Submission, Mechanic, SelectedItem, ChecklistItemValue } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, Wrench, Clock, Tag, MessageSquare, FileText, CheckCircle, ShoppingCart, Package, Printer, Car as CarIcon, ClipboardList, Camera } from 'lucide-react'; // Added CarIcon, ClipboardList, Camera
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton'; 
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [submission, setSubmission] = useState<Submission | null | undefined>(undefined); 
  const [mechanic, setMechanic] = useState<Mechanic | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const sub = getSubmissionById(id);
          if (sub) {
            setSubmission(sub);
            setMechanic(getMechanicById(sub.mechanicId));
            if (sub.status === 'pending') {
              await markSubmissionAsViewedAction(id);
              // Manually update local state if needed or rely on revalidation,
              // for immediate visual feedback:
              setSubmission(s => s ? {...s, status: 'viewed'} : null);
            }
          } else {
            setSubmission(null); 
            toast({
              variant: "destructive",
              title: "Submissão não encontrada",
              description: "O registro que você está tentando acessar não existe ou foi removido.",
            });
            router.replace('/desktop');
          }
        } catch (error) {
          console.error("Error loading submission details:", error);
          setSubmission(null);
           toast({
              variant: "destructive",
              title: "Erro ao carregar",
              description: "Não foi possível carregar os detalhes da submissão.",
            });
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [id, router, toast]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-10 w-36 mb-6" />
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-8 w-1/4 mt-4" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!submission) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-md p-8 text-center">
                <CardTitle className="text-2xl mb-4">Submissão Não Encontrada</CardTitle>
                <CardDescription className="mb-6">
                    O registro que você está tentando acessar não pode ser encontrado.
                </CardDescription>
                <Button asChild>
                    <Link href="/desktop">Voltar ao Painel</Link>
                </Button>
            </Card>
        </div>
    );
  }

  const mechanicName = mechanic?.name || `Usuário ID: ${submission.mechanicId}`;
  let TypeIcon = FileText;
  let typeText = "Detalhes do Registro";
  let typeColor = "text-gray-600"; // This will be overridden by primary color in dark theme generally

  if (submission.type === 'quote') {
    TypeIcon = FileText;
    typeText = 'Orçamento Detalhado';
    typeColor = 'text-primary'; // Use primary for themed color
  } else if (submission.type === 'finished') {
    TypeIcon = CheckCircle;
    typeText = 'Serviço Finalizado Detalhado';
    typeColor = 'text-primary'; // Use primary
  } else if (submission.type === 'checkin') {
    TypeIcon = CarIcon;
    typeText = 'Detalhes do Check-in do Veículo';
    typeColor = 'text-primary'; // Use primary
  }


  return (
    <div className="max-w-4xl mx-auto print:max-w-full print:mx-0">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Button variant="outline" asChild className="group">
          <Link href="/desktop">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Voltar ao Painel
          </Link>
        </Button>
        <Button variant="default" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      <Card className="overflow-hidden shadow-lg print:shadow-none print:border-0">
        <CardHeader className="bg-card-foreground/5 p-6 print:bg-transparent">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center space-x-3">
                    {mechanic && (
                        <Avatar className="h-12 w-12 border-2 border-primary print:hidden">
                        <AvatarImage src={mechanic.photoUrl} alt={mechanicName} data-ai-hint={mechanic.aiHint} />
                        <AvatarFallback>{mechanicName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    )}
                    <div>
                        <CardTitle className="text-2xl font-bold text-foreground">{typeText}</CardTitle>
                        <CardDescription className="text-sm">
                        Registrado por: <span className="font-medium">{mechanicName}</span>
                        </CardDescription>
                    </div>
                </div>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground self-start sm:self-center">
                    <TypeIcon className={`h-5 w-5 ${typeColor}`} /> {/* typeColor will apply if not overridden by more specific Tailwind like text-primary */}
                    <span className="capitalize">{submission.type}</span>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            {submission.customerName && (
              <div className="flex items-start">
                <User className="h-5 w-5 mr-3 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <span className="font-medium text-muted-foreground">Cliente:</span>
                  <p className="text-foreground">{submission.customerName}</p>
                </div>
              </div>
            )}
             {submission.customerContact && (
              <div className="flex items-start">
                <MessageSquare className="h-5 w-5 mr-3 mt-0.5 text-primary flex-shrink-0" /> {/* Using MessageSquare for contact */}
                <div>
                  <span className="font-medium text-muted-foreground">Contato:</span>
                  <p className="text-foreground">{submission.customerContact}</p>
                </div>
              </div>
            )}
            {(submission.vehicleInfo || (submission.vehicleMake && submission.vehicleModel)) && (
              <div className="flex items-start">
                <Wrench className="h-5 w-5 mr-3 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <span className="font-medium text-muted-foreground">Veículo:</span>
                  <p className="text-foreground">
                    {submission.type === 'checkin' 
                      ? `${submission.vehicleMake || ''} ${submission.vehicleModel || ''} ${submission.vehicleYear || ''}`.trim()
                      : submission.vehicleInfo}
                  </p>
                  {submission.vehicleLicensePlate && <p className="text-foreground">Placa: {submission.vehicleLicensePlate}</p>}
                  {submission.vehicleVIN && <p className="text-xs text-muted-foreground">Chassi: {submission.vehicleVIN}</p>}
                </div>
              </div>
            )}
            <div className="flex items-start">
              <Clock className="h-5 w-5 mr-3 mt-0.5 text-primary flex-shrink-0" />
              <div>
                <span className="font-medium text-muted-foreground">Data do Registro:</span>
                <p className="text-foreground">{format(new Date(submission.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
              </div>
            </div>
             {submission.type !== 'checkin' && submission.totalPrice !== undefined && (
              <div className="flex items-start">
                <Tag className="h-5 w-5 mr-3 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <span className="font-medium text-muted-foreground">Valor Total:</span>
                  <p className="text-2xl font-bold text-primary">R$ {submission.totalPrice?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            )}
          </div>

          {submission.type === 'checkin' && submission.serviceRequestDetails && (
             <div>
              <h3 className="text-md font-semibold mb-2 flex items-center"><ClipboardList className="h-5 w-5 mr-2 text-primary" /> Solicitação do Cliente / Problema Relatado</h3>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">{submission.serviceRequestDetails}</p>
            </div>
          )}

          {submission.type !== 'checkin' && submission.notes && (
            <div>
              <h3 className="text-md font-semibold mb-2 flex items-center"><MessageSquare className="h-5 w-5 mr-2 text-primary" /> Observações Adicionais</h3>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">{submission.notes}</p>
            </div>
          )}
          
          {(submission.type === 'quote' || submission.type === 'finished') && submission.items && submission.items.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-md font-semibold mb-3 flex items-center"><ShoppingCart className="h-5 w-5 mr-2 text-primary" /> Itens Registrados</h3>
                <div className="border rounded-lg overflow-hidden print:border print:table-border">
                  <Table>
                    <TableHeader className="print:bg-muted/20">
                      <TableRow>
                        <TableHead className="w-[60px] hidden sm:table-cell print:hidden"></TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Qtd.</TableHead>
                        <TableHead className="text-right">Preço Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submission.items.map(({ item, quantity }) => (
                        <TableRow key={item.id}>
                          <TableCell className="hidden sm:table-cell p-2 print:hidden">
                            <div className="relative h-12 w-12 rounded-md overflow-hidden border bg-muted">
                              <Image src={item.imageUrl} alt={item.name} fill objectFit="cover" data-ai-hint={item.aiHint} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{item.name}</p>
                            <Badge variant={item.type === 'part' ? 'secondary' : 'outline'} className="mt-1 text-xs print:border-none print:px-0 print:py-0 print:bg-transparent print:text-muted-foreground">
                              {item.type === 'part' ? <Package className="h-3 w-3 mr-1 print:hidden" /> : <Wrench className="h-3 w-3 mr-1 print:hidden" />}
                              {item.type === 'part' ? 'Peça' : 'Serviço'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{quantity}</TableCell>
                          <TableCell className="text-right">R$ {item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">R$ {(item.price * quantity).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}

          {submission.type === 'checkin' && submission.checklistItems && submission.checklistItems.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-md font-semibold mb-3 flex items-center"><ClipboardList className="h-5 w-5 mr-2 text-primary" /> Checklist de Entrada do Veículo</h3>
                <div className="space-y-3">
                  {submission.checklistItems.map(item => (
                    <Card key={item.id} className="p-3 bg-muted/30">
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-sm text-foreground">
                        {typeof item.value === 'boolean' ? (item.value ? 'Sim' : 'Não') : item.value}
                      </p>
                      {item.notes && <p className="text-xs text-muted-foreground mt-1"><em>Obs: {item.notes}</em></p>}
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {submission.type === 'checkin' && submission.photoDataUris && submission.photoDataUris.length > 0 && (
             <>
              <Separator />
              <div>
                <h3 className="text-md font-semibold mb-3 flex items-center"><Camera className="h-5 w-5 mr-2 text-primary" /> Fotos do Veículo (Check-in)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {submission.photoDataUris.map((dataUri, index) => (
                    <div key={index} className="relative aspect-video rounded-md overflow-hidden border">
                       <Image src={dataUri} alt={`Foto do veículo ${index + 1}`} fill objectFit="contain" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}


        </CardContent>
        <CardFooter className="bg-card-foreground/5 p-6 flex justify-end print:bg-transparent print:justify-between">
            <p className="text-xs text-muted-foreground print:block hidden">Lima Connect - {submission.type} #{submission.id.substring(0,8)}</p>
            {submission.type !== 'checkin' && submission.totalPrice !== undefined && (
              <p className="text-lg font-bold">Total Geral: <span className="text-primary">R$ {submission.totalPrice?.toFixed(2) || '0.00'}</span></p>
            )}
             {submission.type === 'checkin' && (
              <p className="text-sm text-muted-foreground">Check-in realizado em {format(new Date(submission.timestamp), "dd/MM/yyyy", { locale: ptBR })}</p>
            )}
        </CardFooter>
      </Card>

      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-scheme: light !important; 
          }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:max-w-full { max-width: 100% !important; }
          .print\\:mx-0 { margin-left: 0 !important; margin-right: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-0 { border: 0 !important; }
          .print\\:bg-transparent { background-color: transparent !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:text-muted-foreground { color: hsl(var(--muted-foreground)) !important; }
          .print\\:border-none { border: none !important; }
          .print\\:px-0 { padding-left: 0 !important; padding-right: 0 !important; }
          .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
          .print\\:justify-between { justify-content: space-between !important; }
          .print\\:text-black { color: black !important; }
          .print\\:bg-muted\\/20 { background-color: hsl(var(--muted) / 0.2) !important; }
          .print\\:border { border: 1px solid #e5e7eb !important; } /* Use a light border for print */
          .print\\:table-border table, 
          .print\\:table-border th, 
          .print\\:table-border td {
            border: 1px solid #ddd !important; 
            padding: 8px !important; 
            color: black !important; 
          }
          .print\\:table-border th {
            background-color: #f2f2f2 !important; 
            font-weight: bold;
          }
          .print\\:table-border td p, .print\\:table-border td span {
             color: black !important;
          }
          .print\\:table-border .text-primary {
            color: #0066cc !important; /* A standard blue for print if primary is too light */
          }
          img { /* Ensure images are constrained in print */
            max-width: 100% !important;
            height: auto !important;
            object-fit: contain !important; /* Use contain for print to see whole image */
          }
        }
      `}</style>
    </div>
  );
}
