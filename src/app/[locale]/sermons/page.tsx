import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase-server';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { Sermon } from '@/types/supabase';
import { Search, Upload, X } from 'lucide-react';

interface SermonsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string; language?: string }>;
}

export default async function SermonsPage({ params, searchParams }: SermonsPageProps) {
  const { locale } = await params;
  const { q, status, language } = await searchParams;
  const t = await getTranslations('sermon');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Build query with filters
  let query = supabase
    .from('sermons')
    .select('id, title, speaker, date, status, language')
    .order('created_at', { ascending: false });

  if (q) {
    query = query.or(`title.ilike.%${q}%,speaker.ilike.%${q}%`);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (language) {
    query = query.eq('language', language);
  }

  const { data } = await query;
  const sermons = (data as Sermon[] | null) || [];

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    transcribed: 'bg-purple-100 text-purple-800 border-purple-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    error: 'bg-red-100 text-red-800 border-red-200',
  };

  const hasFilters = Boolean(q || status || language);

  // Build filter link helper
  const buildFilterLink = (updates: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    if (updates.q !== undefined ? updates.q : q) sp.set('q', updates.q !== undefined ? updates.q : q!);
    if (updates.status !== undefined ? updates.status : status) sp.set('status', updates.status !== undefined ? updates.status : status!);
    if (updates.language !== undefined ? updates.language : language) sp.set('language', updates.language !== undefined ? updates.language : language!);
    const qs = sp.toString();
    return `/sermons${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="container py-8 px-4 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <Link href="/workflow">
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            {t('newSermon')}
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <form method="get" className="flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder={`${t('title')} / ${t('speaker')}`}
                  defaultValue={q || ''}
                  className="pl-9"
                />
              </div>
              <Button type="submit">Search</Button>
              {hasFilters && (
                <Link href="/sermons">
                  <Button variant="outline" type="button">
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </Link>
              )}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              {['pending', 'processing', 'transcribed', 'completed', 'error'].map((s) => (
                <Link key={s} href={buildFilterLink({ status: status === s ? undefined : s })}>
                  <Badge
                    variant={status === s ? 'default' : 'outline'}
                    className="cursor-pointer capitalize"
                  >
                    {t(s)}
                  </Badge>
                </Link>
              ))}

              <span className="text-sm text-muted-foreground ml-4">Language:</span>
              {['en', 'es'].map((lang) => (
                <Link key={lang} href={buildFilterLink({ language: language === lang ? undefined : lang })}>
                  <Badge
                    variant={language === lang ? 'default' : 'outline'}
                    className="cursor-pointer uppercase"
                  >
                    {lang}
                  </Badge>
                </Link>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results count */}
      {hasFilters && (
        <p className="text-sm text-muted-foreground mb-4">
          {sermons.length} result{sermons.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Sermons List */}
      <div className="grid gap-4">
        {sermons.length > 0 ? (
          sermons.map((sermon) => (
            <Link key={sermon.id} href={`/sermon/${sermon.id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{sermon.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {sermon.speaker} • {sermon.date} • {sermon.language?.toUpperCase()}
                      </p>
                    </div>
                    <Badge className={`shrink-0 ${statusColors[sermon.status] || 'bg-muted'}`}>
                      {t(sermon.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {hasFilters ? 'No sermons match your filters.' : 'No sermons yet. Upload your first sermon to get started.'}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
