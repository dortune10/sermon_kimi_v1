import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { Sermon } from '@/types/supabase';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user has a church; if not, redirect to onboarding
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('church_id')
    .eq('id', user.id)
    .single();
  const profile = profileRaw as { church_id: string | null } | null;

  if (!profile?.church_id) {
    redirect('/onboarding');
  }

  const { data } = await supabase
    .from('sermons')
    .select('id, title, speaker, date, status, language')
    .order('created_at', { ascending: false })
    .limit(10);

  const sermons = (data as Sermon[] | null) || [];

  return (
    <div className="container py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/workflow">
          <Button>Upload Sermon</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sermons</CardTitle>
        </CardHeader>
        <CardContent>
          {sermons && sermons.length > 0 ? (
            <div className="space-y-4">
              {sermons.map((sermon) => (
                <div
                  key={sermon.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
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
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No sermons yet. Upload your first sermon to get started.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
