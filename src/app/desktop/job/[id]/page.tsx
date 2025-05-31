
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
import { ArrowLeft, User, Wrench, Clock, Tag, MessageSquare, FileText, CheckCircle, ShoppingCart, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge'; // Added import for Badge

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [submission, setSubmission] = useState<Submission | null | undefined>(undefined); // undefined for loading, null for not found
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
              // Optionally, refetch or update local state to reflect 'viewed' status immediately
              // For simplicity, we rely on revalidation or next navigation to show updated status on dashboard
            }
          } else {
            setSubmission(null); // Not found
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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-12 w-1/4 mb-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
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
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!submission) {
    // Message for not found is handled by redirect/toast, but good to have a fallback UI
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
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

  const mechanicName = mechanic?.name || 'Desconhecido';
  const TypeIcon = submission.type === 'quote' ? FileText : CheckCircle;
  const typeText = submission.type === 'quote' ? 'Orçamento Detalhado' : 'Serviço Finalizado Detalhado';

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="outline" asChild className="mb-6 group">
        <Link href="/desktop">
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar ao Painel
        </Link>
      </Button>

      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="bg-card-foreground/5 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center space-x-3">
                    {mechanic && (
                        <Avatar className="h-12 w-12 border-2 border-primary">
                        <AvatarImage src={mechanic.photoUrl} alt={mechanicName} data-ai-hint={mechanic.aiHint} />
                        <AvatarFallback>{mechanicName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    )}
                    <div>
                        <CardTitle className="text-2xl font-bold text-foreground">{typeText}</CardTitle>
                        <CardDescription className="text-sm">
                        Enviado por: <span className="font-medium">{mechanicName}</span> (ID: {submission.mechanicId})
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
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px] hidden sm:table-cell"></TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Qtd.</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submission.items.map(({ item, quantity }) => (
                      <TableRow key={item.id}>
                        <TableCell className="hidden sm:table-cell p-2">
                           <div className="relative h-12 w-12 rounded-md overflow-hidden border bg-muted">
                            <Image src={item.imageUrl} alt={item.name} fill objectFit="cover" data-ai-hint={item.aiHint} />
                           </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{item.name}</p>
                          <Badge variant={item.type === 'part' ? 'secondary' : 'outline'} className="mt-1 text-xs">
                            {item.type === 'part' ? <Package className="h-3 w-3 mr-1" /> : <Wrench className="h-3 w-3 mr-1" />}
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
        <CardFooter className="bg-card-foreground/5 p-6 flex justify-end">
            <p className="text-lg font-bold">Total Geral: <span className="text-primary">R$ {submission.totalPrice?.toFixed(2) || '0.00'}</span></p>
        </CardFooter>
      </Card>
    </div>
  );
}

    