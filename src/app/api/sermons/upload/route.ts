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
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const speaker = formData.get('speaker') as string;

    if (!file || !title) {
      return NextResponse.json({ error: 'Missing file or title' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get user's church
    const { data: profile } = await admin
      .from('profiles')
      .select('church_id')
      .eq('id', user.id)
      .single();

    const churchId = profile?.church_id;

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const filePath = `${churchId || user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await admin.storage
      .from('sermon-audio')
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

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
