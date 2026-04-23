'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase-client';
import { Church, Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Redirect to dashboard if user already has a church
  useEffect(() => {
    const checkChurch = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }
      const { data: profileRaw } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', user.id)
        .single();
      const profile = profileRaw as { church_id: string | null } | null;
      if (profile?.church_id) {
        router.push(`/${locale}/dashboard`);
      }
    };
    checkChurch();
  }, [router, locale]);
  const [name, setName] = useState('');
  const [primaryLanguage, setPrimaryLanguage] = useState<string>(locale === 'es' ? 'es' : 'en');
  const [secondaryLanguage, setSecondaryLanguage] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('America/New_York');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t('nameRequired'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/churches/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          primaryLanguage,
          secondaryLanguage: secondaryLanguage || null,
          timezone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create church');

      toast.success(t('success'));
      router.push(`/${locale}/dashboard`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-12 px-4 max-w-lg mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Church className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('churchName')}</Label>
              <Input
                id="name"
                placeholder={t('churchNamePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryLanguage">{t('primaryLanguage')}</Label>
              <Select value={primaryLanguage} onValueChange={(v) => setPrimaryLanguage(v || 'en')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryLanguage">{t('secondaryLanguage')}</Label>
              <Select value={secondaryLanguage} onValueChange={(v) => setSecondaryLanguage(v || '')}>
                <SelectTrigger>
                  <SelectValue placeholder={t('none')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('none')}</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">{t('timezone')}</Label>
              <Select value={timezone} onValueChange={(v) => setTimezone(v || 'America/New_York')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('creating')}
                </>
              ) : (
                t('createChurch')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
