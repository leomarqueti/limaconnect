
import Link from 'next/link';
import Image from 'next/image';
import type { Submission, UserProfile } from '@/types'; // Changed Mechanic to UserProfile
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Clock, Tag, User, Wrench, FileText, CheckCircle, AlertCircle, Eye, Car, UserCircle as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SubmissionCardProps {
  submission: Submission;
  submitterProfile?: UserProfile; // Changed from mechanic?: Mechanic
}

export function SubmissionCard({ submission, submitterProfile }: SubmissionCardProps) {
  const isPending = submission.status === 'pending';
  const cardClasses = `transition-all duration-300 ease-in-out hover:shadow-xl ${
    isPending ? 'border-primary shadow-primary/20 animate-pulse-border' : 'border-border'
  }`;

  let typeText = '';
  let TypeIcon: React.ElementType = FileText;

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
      TypeIcon = Car;
      break;
    default:
      typeText = 'Registro';
  }
  
  const statusText = isPending ? 'Pendente' : 'Visualizado';
  const StatusIcon = isPending ? AlertCircle : Eye;
  const statusVariant = isPending ? 'destructive' : 'default';

  const submitterDisplayName = submitterProfile?.displayName || `Usuário ID: ${submission.mechanicId.substring(0, 8)}...`;
  const submitterAvatarFallback = submitterProfile?.displayName 
    ? submitterProfile.displayName.substring(0, 2).toUpperCase() 
    : submission.mechanicId.substring(0,2).toUpperCase();
  const avatarAiHint = submitterProfile?.displayName ? "user profile" : "user icon";


  let cardTitle = submitterDisplayName;
  let cardDescription = `ID Usuário: ${submission.mechanicId.substring(0,12)}...`;

  if (submission.mechanicId === 'office_user') {
    cardTitle = "Escritório Lima Connect";
    cardDescription = "Registro via Painel Desktop";
  } else if (submission.mechanicId === 'tablet_user') {
    cardTitle = "Recepção / Check-in";
    cardDescription = "Registro via Tablet";
  } else if (submitterProfile) {
     cardTitle = submitterProfile.displayName;
     cardDescription = submitterProfile.email || `ID: ${submission.mechanicId.substring(0,12)}...`;
  }


  return (
    <Card className={cardClasses}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="h-10 w-10 border">
            {submitterProfile?.photoURL ? (
              <AvatarImage src={submitterProfile.photoURL} alt={submitterDisplayName} data-ai-hint={avatarAiHint} />
            ) : (
              <UserIcon className="h-full w-full p-2 text-muted-foreground" /> 
            )}
            <AvatarFallback>{submitterAvatarFallback}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg font-semibold">{cardTitle}</CardTitle>
            <CardDescription className="text-xs">{cardDescription}</CardDescription>
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
              {submission.type === 'checkin' ? `${submission.vehicleMake || ''} ${submission.vehicleModel || ''}`.trim() : submission.vehicleInfo}
              {submission.vehicleLicensePlate && ` (${submission.vehicleLicensePlate})`}
            </span>
          </div>
        )}
        <div className="flex items-center text-muted-foreground">
          <Clock className="h-4 w-4 mr-2 text-primary" />
          Registrado: <span className="font-medium text-foreground ml-1">
            {submission.timestamp && typeof submission.timestamp.getTime === 'function' && !isNaN(submission.timestamp.getTime())
              ? format(submission.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
              : 'Data indisponível'}
          </span>
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
