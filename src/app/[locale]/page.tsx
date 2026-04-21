import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const t = useTranslations('landing');

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <span className="text-xl font-bold">SermonScriber</span>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24">
        <div className="max-w-3xl text-center space-y-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            {t('heroTitle')}
          </h1>
          <p className="text-lg text-muted-foreground sm:text-xl">
            {t('heroSubtitle')}
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/login">
              <Button size="lg">{t('getStarted')}</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
