'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Users, CreditCard, LogOut, LayoutDashboard, Pill, ShieldCheck, Menu } from 'lucide-react';
import Loader from '@/components/Loader';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAuthenticated, loading, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (loading) return;

    if (isLoginPage) {
      if (isAuthenticated && user?.type === 'admin') {
        router.replace('/admin/dashboard');
      }
      return;
    }

    if (!isAuthenticated || user?.type !== 'admin') {
      router.replace('/admin/login');
    }
  }, [isAuthenticated, user, loading, router, isLoginPage]);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      current: pathname === '/admin/dashboard'
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      current: pathname === '/admin/users'
    },
    {
      name: 'Payments',
      href: '/admin/payments',
      icon: CreditCard,
      current: pathname === '/admin/payments'
    },
    {
      name: 'Pharmacy',
      href: '/admin/pharmacy',
      icon: Pill,
      current: pathname === '/admin/pharmacy'
    }
  ];

  const pageTitle = navigationItems.find((item) => item.current)?.name || 'Admin Portal';

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated || user?.type !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-600">HealthMate Admin</p>
                <h1 className="text-xl font-bold text-slate-900">{pageTitle}</h1>
                <p className="text-sm text-slate-500">Welcome back, {user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                <Menu className="mr-2 h-3.5 w-3.5" />
                Secure admin session
              </div>
              <Button variant="outline" onClick={handleLogout} className="border-slate-200 bg-white">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.name}
                  variant={item.current ? 'default' : 'ghost'}
                  onClick={() => router.push(item.href)}
                  className={`shrink-0 rounded-full px-4 ${
                    item.current
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
