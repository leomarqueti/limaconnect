
"use client"; 

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; 
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PackageSearch, LayoutDashboard, LogOut, UserCircle } from 'lucide-react'; 
import { useAuth } from '@/contexts/AuthContext'; 

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth(); 
  const isDesktopView = pathname.startsWith('/desktop');
  const isLoginPage = pathname === '/login' || pathname === '/register'; // Include register page

  const handleLogout = async () => {
    await logout();
  };

  if (isLoginPage && !user && !loading) {
    return null;
  }
   if (isLoginPage && !user && loading) {
     return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo />
            <span className="font-bold sm:inline-block font-headline">
              Lima Connect
            </span>
          </Link>
        </div>
      </header>
     );
   }


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Logo />
          <span className="font-bold sm:inline-block font-headline">
            Lima Connect
          </span>
        </Link>
        
        <div className="flex items-center space-x-4">
          {isDesktopView && user && ( 
            <nav className="hidden sm:flex items-center space-x-2">
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
            </nav>
          )}

          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground hidden sm:inline items-center">
                <UserCircle className="inline mr-1 h-4 w-4" />
                {user.profile?.displayName || user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout} disabled={loading}>
                <LogOut className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          ) : (
            !isLoginPage && !loading && ( 
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">
                  Login
                </Link>
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
