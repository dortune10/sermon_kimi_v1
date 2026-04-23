'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase-client';

export default function WorkflowPage() {
  const t = useTranslations('upload');
  const locale = useLocale();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Redirect to onboarding if user has no church
  useEffect(() => {
    const checkChurch = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profileRaw } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', user.id)
        .single();
      const profile = profileRaw as { church_id: string | null } | null;
      if (!profile?.church_id) {
        router.push(`/${locale}/onboarding`);
      }
    };
    checkChurch();
  }, [router, locale]);

  const MAX_FILE_SIZE_MB = 50;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File too large (${formatFileSize(file.size)}). Maximum allowed is ${MAX_FILE_SIZE_MB}MB. Try compressing your audio file to 128kbps MP3.`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const supabase = createClient();

      // 1. Get current user to build the file path
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to upload');
      }

      // 2. Upload file directly to Supabase Storage (bypasses Vercel 4.5MB limit)
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: storageError } = await supabase.storage
        .from('sermon-audio')
        .upload(filePath, file, { upsert: false });

      if (storageError) {
        if (storageError.message.includes('maximum allowed size') || storageError.message.includes('too large')) {
          throw new Error(`File too large for storage. Maximum is ${MAX_FILE_SIZE_MB}MB. Compress your audio to 128kbps MP3 (typically 30-45MB for a 1-hour sermon).`);
        }
        throw new Error(storageError.message);
      }

      // 3. Create sermon record via API
      const res = await fetch('/api/sermons/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          speaker,
          filePath,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = { error: `HTTP ${res.status}` };
      }

      if (!res.ok) {
        throw new Error(data.error || `Upload failed (${res.status})`);
      }

      toast.success(t('success'));
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('error'));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="container max-w-2xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-6">
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50"
              onClick={() => document.getElementById('file')?.click()}
            >
              <input
                id="file"
                type="file"
                accept="audio/*,video/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <p className="text-muted-foreground">
                {file ? (
                  <span>
                    {file.name}
                    <span className={`ml-2 text-xs ${file.size > MAX_FILE_SIZE_BYTES ? 'text-red-500 font-medium' : 'text-green-600'}`}>
                      ({formatFileSize(file.size)})
                      {file.size > MAX_FILE_SIZE_BYTES && ` — exceeds ${MAX_FILE_SIZE_MB}MB limit`}
                    </span>
                  </span>
                ) : t('dropzone')}
              </p>
              <p className="text-xs text-muted-foreground mt-2">{t('supportedFormats')} • Max {MAX_FILE_SIZE_MB}MB</p>
            </div>

            {uploading && (
              <div className="w-full bg-muted rounded-full h-2 animate-pulse">
                <div className="bg-primary h-2 rounded-full w-1/2" />
                <p className="text-xs text-muted-foreground mt-1">Uploading...</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="speaker">Speaker</Label>
              <Input id="speaker" value={speaker} onChange={(e) => setSpeaker(e.target.value)} />
            </div>

            <Button type="submit" className="w-full" disabled={uploading || !file}>
              {uploading ? t('uploading') : t('uploadButton')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
