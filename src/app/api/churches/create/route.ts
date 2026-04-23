import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, primaryLanguage, secondaryLanguage, timezone } = body;

  if (!name || !primaryLanguage) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const slug = `${slugify(name)}-${Date.now().toString(36)}`;

  const admin = createAdminClient();

  // Create church
  const { data: church, error: churchError } = await admin
    .from('churches')
    .insert({
      name,
      slug,
      primary_language: primaryLanguage,
      secondary_language: secondaryLanguage || null,
      timezone: timezone || 'America/New_York',
      plan_tier: 'spark',
    })
    .select('id')
    .single();

  if (churchError || !church) {
    return NextResponse.json(
      { error: churchError?.message || 'Failed to create church' },
      { status: 500 }
    );
  }

  // Update user's profile with church and role
  const { error: profileError } = await admin
    .from('profiles')
    .update({ church_id: church.id, role: 'owner' })
    .eq('id', user.id);

  if (profileError) {
    // Rollback: delete the church we just created
    await admin.from('churches').delete().eq('id', church.id);
    return NextResponse.json(
      { error: profileError.message || 'Failed to link church to profile' },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: church.id, slug });
}
