
import Link from 'next/link';
import Image from 'next/image';
import type { Submission, Mechanic } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Clock, Tag, User, Wrench, FileText, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SubmissionCardProps {
  submission: Submission;
  mechanic?: Mechanic;
}

export function SubmissionCard({ submission, mechanic }: SubmissionCardProps) {
  const isPending = submission.status === 'pending';
  const cardClasses = `transition-all duration-300 ease-in-out hover:shadow-xl ${
    isPending ? 'border-primary shadow-primary/20 animate-pulse-border' : 'border-border'
  }`;

  const typeText = submission.type === 'quote' ? 'Orçamento' : 'Serviço Finalizado';
  const TypeIcon = submission.type === 'quote' ? FileText : CheckCircle;
  
  const statusText = isPending ? 'Pendente' : 'Visualizado';
  const StatusIcon = isPending ? AlertCircle : Eye;
  const statusVariant = isPending ? 'destructive' : 'default';


  return (
    <Card className={cardClasses}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3 mb-3">
          {mechanic && (
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={mechanic.photoUrl} alt={mechanic.name} data-ai-hint={mechanic.aiHint} />
              <AvatarFallback>{mechanic.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          )}
          <div>
            <CardTitle className="text-lg font-semibold">{mechanic?.name || 'Mecânico Desconhecido'}</CardTitle>
            <CardDescription className="text-xs">ID: {submission.mechanicId}</CardDescription>
          </div>
        </div>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm">
                <TypeIcon className={`h-5 w-5 ${submission.type === 'quote' ? 'text-blue-500' : 'text-green-500'}`} />
                <span className="font-medium">{typeText}</span>
            </div>
            <Badge variant={statusVariant} className="text-xs">
                <StatusIcon className="h-3 w-3 mr-1.5" />
                {statusText}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 text-sm pb-4">
        {submission.customerName && (
          <div className="flex items-center text-muted-foreground">
            <User className="h-4 w-4 mr-2 text-primary" />
            Cliente: <span className="font-medium text-foreground ml-1">{submission.customerName}</span>
          </div>
        )}
        {submission.vehicleInfo && (
          <div className="flex items-center text-muted-foreground">
            <Wrench className="h-4 w-4 mr-2 text-primary" />
            Veículo: <span className="font-medium text-foreground ml-1">{submission.vehicleInfo}</span>
          </div>
        )}
        <div className="flex items-center text-muted-foreground">
          <Clock className="h-4 w-4 mr-2 text-primary" />
          Enviado: <span className="font-medium text-foreground ml-1">{format(new Date(submission.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <Tag className="h-4 w-4 mr-2 text-primary" />
          Total: <span className="font-bold text-lg text-foreground ml-1">R$ {submission.totalPrice?.toFixed(2) || '0.00'}</span>
        </div>
         {submission.notes && (
          <p className="text-xs text-muted-foreground pt-1 border-t border-dashed mt-2">
            <strong>Obs:</strong> {submission.notes.length > 50 ? `${submission.notes.substring(0, 50)}...` : submission.notes}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" variant={isPending ? 'default' : 'secondary'}>
          <Link href={`/desktop/job/${submission.id}`}>
            {isPending ? 'Analisar' : 'Ver Detalhes'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
