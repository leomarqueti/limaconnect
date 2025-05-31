import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, CheckCircle } from 'lucide-react';

// Assume a default mechanic for simplicity in this example
const DEFAULT_MECHANIC_ID = 'mech1';

export default function MobileHomePage() {
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8 text-center font-headline">Registro de Serviço</h1>
      <p className="text-muted-foreground mb-8 text-center">Selecione o tipo de registro que deseja fazer:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-md">
        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardHeader>
            <FileText className="w-10 h-10 mx-auto text-primary mb-2" />
            <CardTitle className="font-headline">Montar Orçamento</CardTitle>
            <CardDescription>Crie um novo orçamento para o cliente.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/mobile/new-submission?type=quote&mechanicId=${DEFAULT_MECHANIC_ID}`}>
                Iniciar Orçamento
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardHeader>
            <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-2" />
            <CardTitle className="font-headline">Serviço Finalizado</CardTitle>
            <CardDescription>Registre um serviço que foi concluído.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="secondary">
              <Link href={`/mobile/new-submission?type=finished&mechanicId=${DEFAULT_MECHANIC_ID}`}>
                Registrar Serviço
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}