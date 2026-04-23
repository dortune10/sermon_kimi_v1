'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { Menu, X, LogOut, Mic2, Globe } from 'lucide-react';

export default function Navbar() {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: t('dashboard') },
    { href: '/sermons', label: t('sermons') },
    { href: '/workflow', label: t('workflow') },
  ];

  const isActive = (href: string) => {
    // Remove locale prefix from pathname for comparison
    const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '') || '/';
    return pathWithoutLocale === href || pathWithoutLocale.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
    router.refresh();
  };

  const otherLocale = locale === 'en' ? 'es' : 'en';
  const localeLabels: Record<string, string> = { en: 'English', es: 'Español' };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <Mic2 className="h-5 w-5" />
          <span>SermonScriber</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive(item.href) ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Locale + Logout */}
        <div className="hidden md:flex items-center gap-1">
          <Link href={pathname} locale={otherLocale} className="inline-flex items-center justify-center rounded-lg text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted hover:text-foreground h-7 px-2.5">
            <Globe className="h-4 w-4 mr-1" />
            {localeLabels[otherLocale]}
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            {t('logout')}
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 py-4 space-y-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block text-sm font-medium ${
                isActive(item.href) ? 'text-foreground' : 'text-muted-foreground'
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={pathname}
            locale={otherLocale}
            onClick={() => setMobileOpen(false)}
            className="flex items-center rounded-lg text-sm font-medium px-2.5 py-2 hover:bg-muted transition-colors"
          >
            <Globe className="h-4 w-4 mr-2" />
            {localeLabels[otherLocale]}
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start">
            <LogOut className="h-4 w-4 mr-2" />
            {t('logout')}
          </Button>
        </div>
      )}
    </header>
  );
}
