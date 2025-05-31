
import { AppHeader } from '@/components/shared/AppHeader';

export default function TabletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="text-center py-4 border-t bg-background">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Lima Connect - Interface de Check-in Tablet
        </p>
      </footer>
    </div>
  );
}
