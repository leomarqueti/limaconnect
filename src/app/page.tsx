import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Smartphone, Monitor } from 'lucide-react';
import { AppHeader } from '@/components/shared/AppHeader';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 font-headline">Bem-vindo ao AutoService Link</h1>
          <p className="text-lg text-muted-foreground">
            Selecione a interface que deseja acessar:
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="items-center">
              <Smartphone className="w-12 h-12 text-primary mb-2" />
              <CardTitle className="font-headline">Interface Móvel</CardTitle>
              <CardDescription>Para mecânicos registrarem serviços e peças.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild size="lg">
                <Link href="/mobile">Acessar Mobile</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="items-center">
              <Monitor className="w-12 h-12 text-primary mb-2" />
              <CardTitle className="font-headline">Interface Desktop</CardTitle>
              <CardDescription>Para o escritório visualizar orçamentos e serviços.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild size="lg">
                <Link href="/desktop">Acessar Desktop</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="text-center py-4 border-t">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} AutoService Link. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}