import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';

export default async function SermonsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data } = await supabase
    .from('sermons')
    .select('id, title, speaker, date, status, language')
    .order('created_at', { ascending: false });

  const sermons = data || [];

  return (
    <div className="container py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Sermons</h1>
        <Link href="/workflow">
          <Button>Upload Sermon</Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {sermons && sermons.length > 0 ? (
          sermons.map((sermon) => (
            <Link key={sermon.id} href={`/sermon/${sermon.id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{sermon.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {sermon.speaker} • {sermon.date} • {sermon.language}
                      </p>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted">
                      {sermon.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No sermons yet. Upload your first sermon to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
