import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase-server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sermon, ScriptureReference, ContentAsset } from '@/types/supabase';
import { BookOpen, FileText, Share2, Sparkles, Headphones } from 'lucide-react';

interface SermonPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function SermonPage({ params }: SermonPageProps) {
  const { id, locale } = await params;
  const t = await getTranslations('sermon');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data } = await supabase
    .from('sermons')
    .select('*, scripture_references(*), content_assets(*)')
    .eq('id', id)
    .single();

  const sermon = data as (Sermon & { scripture_references: ScriptureReference[]; content_assets: ContentAsset[] }) | null;

  if (!sermon) {
    notFound();
  }

  // Group content assets by type
  const assetsByType: Record<string, ContentAsset[]> = {};
  if (sermon.content_assets) {
    for (const asset of sermon.content_assets) {
      if (!assetsByType[asset.type]) assetsByType[asset.type] = [];
      assetsByType[asset.type].push(asset);
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    transcribed: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
  };

  const assetTypeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    summary: { label: t('summary'), icon: <FileText className="h-4 w-4" /> },
    social_post: { label: t('socialPost'), icon: <Share2 className="h-4 w-4" /> },
    study_guide: { label: t('studyGuide'), icon: <BookOpen className="h-4 w-4" /> },
  };

  return (
    <div className="container py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{sermon.title}</h1>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <span className="text-muted-foreground">{sermon.speaker}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{sermon.date}</span>
          <Badge className={statusColors[sermon.status] || 'bg-muted'}>{t(sermon.status)}</Badge>
          <Badge variant="outline">{sermon.language}</Badge>
        </div>
      </div>

      {/* Audio Player */}
      {sermon.audio_url && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              {t('audio')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <audio controls className="w-full" preload="metadata">
              <source src={sermon.audio_url} />
              Your browser does not support the audio element.
            </audio>
          </CardContent>
        </Card>
      )}

      {/* Transcript */}
      {sermon.transcript && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('transcript')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{sermon.transcript}</p>
          </CardContent>
        </Card>
      )}

      {/* Scripture References */}
      {sermon.scripture_references && sermon.scripture_references.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('scriptures')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sermon.scripture_references.map((ref: any) => (
                <Badge key={ref.id} variant="secondary">
                  {ref.normalized_ref}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Content Assets */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {t('generatedContent')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(assetsByType).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(assetsByType).map(([type, assets]) => {
                const config = assetTypeConfig[type] || { label: type, icon: <Sparkles className="h-4 w-4" /> };
                return (
                  <div key={type} className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                      {config.icon}
                      {config.label}
                    </h3>
                    {assets.map((asset) => (
                      <div
                        key={asset.id}
                        className="p-4 rounded-lg bg-muted/50 border text-sm leading-relaxed whitespace-pre-wrap"
                      >
                        {asset.content}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t('noContent')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
