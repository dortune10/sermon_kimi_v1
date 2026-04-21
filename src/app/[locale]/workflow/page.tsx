'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase-client';

export default function WorkflowPage() {
  const t = useTranslations('upload');
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

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
                {file ? file.name : t('dropzone')}
              </p>
              <p className="text-xs text-muted-foreground mt-2">{t('supportedFormats')}</p>
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
