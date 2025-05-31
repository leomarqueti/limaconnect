
import Link from 'next/link';
import Image from 'next/image';
import type { Submission, Mechanic } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Clock, Tag, User, Wrench, FileText, CheckCircle, AlertCircle, Eye, Car } from 'lucide-react'; // Added Car icon
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

  let typeText = '';
  let TypeIcon: React.ElementType = FileText; // Default icon

  switch (submission.type) {
    case 'quote':
      typeText = 'Orçamento';
      TypeIcon = FileText;
      break;
    case 'finished':
      typeText = 'Serviço Finalizado';
      TypeIcon = CheckCircle;
      break;
    case 'checkin':
      typeText = 'Check-in de Veículo';
      TypeIcon = Car; // Using Car icon for check-in
      break;
    default:
      typeText = 'Registro'; // Fallback
  }
  
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
            <CardTitle className="text-lg font-semibold">{mechanic?.name || 'Sistema'}</CardTitle>
            <CardDescription className="text-xs">
              {submission.type === 'checkin' ? `Registrado por: ${mechanic?.name || 'Recepção'}` : `ID Mecânico: ${submission.mechanicId}`}
            </CardDescription>
          </div>
        </div>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm">
                <TypeIcon className={`h-5 w-5 ${
                  submission.type === 'quote' ? 'text-blue-500' : 
                  submission.type === 'finished' ? 'text-green-500' : 
                  submission.type === 'checkin' ? 'text-purple-500' : 'text-gray-500'
                }`} />
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
        {(submission.vehicleInfo || (submission.vehicleMake && submission.vehicleModel)) && (
          <div className="flex items-center text-muted-foreground">
            <Wrench className="h-4 w-4 mr-2 text-primary" />
            Veículo: <span className="font-medium text-foreground ml-1">
              {submission.type === 'checkin' ? `${submission.vehicleMake} ${submission.vehicleModel}` : submission.vehicleInfo}
              {submission.vehicleLicensePlate && ` (${submission.vehicleLicensePlate})`}
            </span>
          </div>
        )}
        <div className="flex items-center text-muted-foreground">
          <Clock className="h-4 w-4 mr-2 text-primary" />
          Registrado: <span className="font-medium text-foreground ml-1">{format(new Date(submission.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
        </div>
        {submission.type !== 'checkin' && submission.totalPrice !== undefined && (
          <div className="flex items-center text-muted-foreground">
            <Tag className="h-4 w-4 mr-2 text-primary" />
            Total: <span className="font-bold text-lg text-foreground ml-1">R$ {submission.totalPrice?.toFixed(2) || '0.00'}</span>
          </div>
        )}
         {(submission.notes || submission.serviceRequestDetails) && (
          <p className="text-xs text-muted-foreground pt-1 border-t border-dashed mt-2">
            <strong>{submission.type === 'checkin' ? 'Solicitação:' : 'Obs:'}</strong> 
            {
              (submission.type === 'checkin' ? submission.serviceRequestDetails : submission.notes)?.substring(0, 70)
            }
            {(submission.type === 'checkin' ? submission.serviceRequestDetails : submission.notes)?.length || 0 > 70 ? '...' : ''}
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
