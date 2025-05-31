
import Link from 'next/link';
import { getSubmissions, getMechanicById, getPartsAndServices } from '@/lib/data';
import type { Submission, Mechanic, PartOrService } from '@/types';
import { SubmissionCard } from '@/components/desktop/SubmissionCard';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ListChecks, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Added Button import

// Assume a default mechanic for office submissions
const OFFICE_MECHANIC_ID = 'office_user';


export default function DesktopDashboardPage() {
  const submissions = getSubmissions();
  const mechanics = submissions.reduce((acc, sub) => {
    if (!acc[sub.mechanicId]) {
      acc[sub.mechanicId] = getMechanicById(sub.mechanicId);
    }
    return acc;
  }, {} as Record<string, Mechanic | undefined>);

  const allPartsAndServices = getPartsAndServices(); 

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-headline">
            Painel de Submissões
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe os orçamentos e serviços registrados.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/desktop/new-submission?type=quote&mechanicId=${OFFICE_MECHANIC_ID}`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Orçamento
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/desktop/new-submission?type=finished&mechanicId=${OFFICE_MECHANIC_ID}`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Serviço
            </Link>
          </Button>
        </div>
      </div>

      {submissions.length === 0 ? (
        <Alert>
          <ListChecks className="h-4 w-4" />
          <AlertTitle>Nenhuma Submissão</AlertTitle>
          <AlertDescription>
            Ainda não há orçamentos ou serviços registrados. Assim que os mecânicos ou o escritório enviarem, eles aparecerão aqui.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((submission) => {
            const mechanic = mechanics[submission.mechanicId] || getMechanicById(submission.mechanicId); // Ensure mechanic is fetched if not in accumulated list (e.g. office_user)
            return (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                mechanic={mechanic}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

    