
import Link from 'next/link';
import { getSubmissions, getMechanicById, getPartsAndServices } from '@/lib/data';
import type { Submission, Mechanic, PartOrService } from '@/types';
import { SubmissionCard } from '@/components/desktop/SubmissionCard';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ListChecks } from 'lucide-react';

export default function DesktopDashboardPage() {
  const submissions = getSubmissions();
  const mechanics = submissions.reduce((acc, sub) => {
    if (!acc[sub.mechanicId]) {
      acc[sub.mechanicId] = getMechanicById(sub.mechanicId);
    }
    return acc;
  }, {} as Record<string, Mechanic | undefined>);

  const allPartsAndServices = getPartsAndServices(); // Fetch all parts and services for details if needed

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground font-headline">
          Painel de Submissões
        </h1>
        <p className="text-muted-foreground">
          Acompanhe os orçamentos e serviços registrados.
        </p>
      </div>

      {submissions.length === 0 ? (
        <Alert>
          <ListChecks className="h-4 w-4" />
          <AlertTitle>Nenhuma Submissão</AlertTitle>
          <AlertDescription>
            Ainda não há orçamentos ou serviços registrados. Assim que os mecânicos enviarem, eles aparecerão aqui.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((submission) => {
            const mechanic = mechanics[submission.mechanicId];
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
