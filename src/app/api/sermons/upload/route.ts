import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { inngest } from '@/lib/inngest/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, speaker, filePath } = body;

    if (!title || !filePath) {
      return NextResponse.json({ error: 'Missing title or filePath' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get user's church
    const { data: profile } = await admin
      .from('profiles')
      .select('church_id')
      .eq('id', user.id)
      .single();

    const churchId = profile?.church_id;

    if (!churchId) {
      return NextResponse.json({ error: 'User is not assigned to a church' }, { status: 400 });
    }

    // Get public URL for the uploaded file
    const { data: publicUrlData } = admin.storage.from('sermon-audio').getPublicUrl(filePath);

    // Create sermon record
    const { data: sermon, error: dbError } = await admin
      .from('sermons')
      .insert({
        church_id: churchId,
        title,
        speaker: speaker || null,
        status: 'pending',
        language: 'en',
        audio_url: publicUrlData.publicUrl,
      })
      .select('id, church_id, audio_url')
      .single();

    if (dbError || !sermon) {
      return NextResponse.json({ error: dbError?.message || 'Failed to create sermon' }, { status: 500 });
    }

    // Send Inngest event
    await inngest.send({
      name: 'sermon.uploaded',
      data: {
        sermonId: sermon.id,
        churchId: sermon.church_id || '',
        audioUrl: sermon.audio_url || '',
        language: 'en',
      },
    });

    return NextResponse.json({ id: sermon.id, status: 'pending' });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
