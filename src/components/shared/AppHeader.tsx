
"use client"; 

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; 
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PackageSearch, LayoutDashboard, LogOut, UserCircle, Settings, Archive } from 'lucide-react'; 
import { useAuth } from '@/contexts/AuthContext'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth(); 
  const isDesktopView = pathname.startsWith('/desktop');
  const isLoginPage = pathname === '/login' || pathname === '/register';

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
              <Button variant={pathname === '/desktop/history' ? 'secondary' : 'ghost'} size="sm" asChild>
                <Link href="/desktop/history">
                  <Archive className="mr-2 h-4 w-4" />
                  Histórico
                </Link>
              </Button>
            </nav>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage 
                        src={user.profile?.photoURL || undefined} 
                        alt={user.profile?.displayName || user.email || "User Avatar"} 
                        data-ai-hint={user.profile?.photoURL ? "user profile" : "avatar placeholder"}
                    />
                    <AvatarFallback>
                      {(user.profile?.displayName || user.email || 'U').substring(0,2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.profile?.displayName || 'Usuário'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile/edit">
                    <Settings className="mr-2 h-4 w-4" />
                    Editar Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={loading}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
