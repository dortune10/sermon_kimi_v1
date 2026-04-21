import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SermonPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function SermonPage({ params }: SermonPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: sermon } = await supabase
    .from('sermons')
    .select('*, scripture_references(*)')
    .eq('id', id)
    .single();

  if (!sermon) {
    notFound();
  }

  return (
    <div className="container py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{sermon.title}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-muted-foreground">{sermon.speaker}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{sermon.date}</span>
          <Badge variant="secondary">{sermon.status}</Badge>
          <Badge variant="outline">{sermon.language}</Badge>
        </div>
      </div>

      {sermon.transcript && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{sermon.transcript}</p>
          </CardContent>
        </Card>
      )}

      {sermon.scripture_references && sermon.scripture_references.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scripture References</CardTitle>
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
    </div>
  );
}
