
import { AppHeader } from '@/components/shared/AppHeader';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
