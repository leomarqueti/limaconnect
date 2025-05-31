
"use client"; // Needs to be client component if it uses hooks like usePathname

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PackageSearch, LayoutDashboard } from 'lucide-react';

export function AppHeader() {
  const pathname = usePathname();
  const isDesktopView = pathname.startsWith('/desktop');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Logo />
          <span className="font-bold sm:inline-block font-headline">
            AutoService Link
          </span>
        </Link>
        {isDesktopView && (
          <nav className="flex items-center space-x-2">
            <Button variant={pathname === '/desktop' ? 'secondary' : 'ghost'} size="sm" asChild>
              <Link href="/desktop">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Painel
              </Link>
            </Button>
            <Button variant={pathname === '/desktop/inventory' ? 'secondary' : 'ghost'} size="sm" asChild>
              <Link href="/desktop/inventory">
                <PackageSearch className="mr-2 h-4 w-4" />
                Gerenciar Inventário
              </Link>
            </Button>
            {/* Adicionar mais links de navegação do desktop aqui se necessário */}
          </nav>
        )}
      </div>
    </header>
  );
}
