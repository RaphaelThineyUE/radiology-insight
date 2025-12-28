import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Upload, FolderOpen, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/library', label: 'Library', icon: FolderOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const log = createLogger('AppLayout');
  const { signOut, user } = useAuth();
  const location = useLocation();
  log.info('Render AppLayout', { path: location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo-ribbon.svg" alt="Breast Cancer Ribbon" className="h-8 w-8" />
              <span className="font-bold text-xl text-primary">RadiologyExtract Pro</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Button key={href} asChild variant={location.pathname === href ? 'secondary' : 'ghost'} size="sm">
                  <Link to={href} className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</Link>
                </Button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut()}><LogOut className="h-4 w-4 mr-2" />Sign out</Button>
            {log.debug('User email', { email: user?.email })}
          </div>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}
