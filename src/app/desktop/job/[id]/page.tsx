
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getSubmissionById, getMechanicById } from '@/lib/data';
import { markSubmissionAsViewedAction } from '@/lib/actions';
import type { Submission, Mechanic, SelectedItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, Wrench, Clock, Tag, MessageSquare, FileText, CheckCircle, ShoppingCart, Package, Printer } from 'lucide-react';
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
  const TypeIcon = submission.type === 'quote' ? FileText : CheckCircle;
  const typeText = submission.type === 'quote' ? 'Orçamento Detalhado' : 'Serviço Finalizado Detalhado';

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
                        Enviado por: <span className="font-medium">{mechanicName}</span>
                        </CardDescription>
                    </div>
                </div>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground self-start sm:self-center">
                    <TypeIcon className={`h-5 w-5 ${submission.type === 'quote' ? 'text-blue-600' : 'text-green-600'}`} />
                    <span>{submission.type === 'quote' ? 'Orçamento' : 'Serviço Finalizado'}</span>
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
            {submission.vehicleInfo && (
              <div className="flex items-start">
                <Wrench className="h-5 w-5 mr-3 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <span className="font-medium text-muted-foreground">Veículo:</span>
                  <p className="text-foreground">{submission.vehicleInfo}</p>
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
             <div className="flex items-start">
              <Tag className="h-5 w-5 mr-3 mt-0.5 text-primary flex-shrink-0" />
              <div>
                <span className="font-medium text-muted-foreground">Valor Total:</span>
                <p className="text-2xl font-bold text-primary">R$ {submission.totalPrice?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          {submission.notes && (
            <div>
              <h3 className="text-md font-semibold mb-2 flex items-center"><MessageSquare className="h-5 w-5 mr-2 text-primary" /> Observações Adicionais</h3>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">{submission.notes}</p>
            </div>
          )}
          
          <Separator />

          <div>
            <h3 className="text-md font-semibold mb-3 flex items-center"><ShoppingCart className="h-5 w-5 mr-2 text-primary" /> Itens Registrados</h3>
            {submission.items.length > 0 ? (
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
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma peça ou serviço adicionado a esta submissão.</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-card-foreground/5 p-6 flex justify-end print:bg-transparent print:justify-between">
            <p className="text-xs text-muted-foreground print:block hidden">AutoService Link - {submission.type === 'quote' ? 'Orçamento' : 'Serviço'} #{submission.id.substring(0,8)}</p>
            <p className="text-lg font-bold">Total Geral: <span className="text-primary">R$ {submission.totalPrice?.toFixed(2) || '0.00'}</span></p>
        </CardFooter>
      </Card>

      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-scheme: light !important; /* Forçar esquema de cores claro para impressão */
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
          .print\\:border { border: 1px solid #e5e7eb !important; } /* Cor de borda genérica para impressão */


          /* Estilos específicos para a tabela na impressão */
          .print\\:table-border table, 
          .print\\:table-border th, 
          .print\\:table-border td {
            border: 1px solid #ddd !important; /* Cor de borda mais visível */
            padding: 8px !important; /* Adiciona padding para melhor leitura */
            color: black !important; /* Garante texto preto */
          }
          .print\\:table-border th {
            background-color: #f2f2f2 !important; /* Fundo leve para cabeçalhos */
            font-weight: bold;
          }
          .print\\:table-border td p, .print\\:table-border td span {
             color: black !important;
          }
          .print\\:table-border .text-primary {
            color: hsl(var(--primary)) !important; /* Manter cor primária se desejado, ou mudar para preto */
          }
           /* Esconde elementos que não fazem sentido na impressão */
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
    
    
      