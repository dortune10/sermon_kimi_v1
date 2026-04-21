import { inngest } from './client';
import { createAdminClient } from '@/lib/supabase-admin';

export const transcribeSermon = inngest.createFunction(
  { id: 'transcribe-sermon' },
  { event: 'sermon.uploaded' },
  async ({ event, step }) => {
    const { sermonId, audioUrl } = event.data;

    await step.run('update-status', async () => {
      const admin = createAdminClient();
      await admin.from('sermons').update({ status: 'processing' }).eq('id', sermonId);
    });

    // TODO: Call Gemini for transcription
    // For now, simulate processing
    await step.run('transcribe', async () => {
      const admin = createAdminClient();
      await admin
        .from('sermons')
        .update({
          status: 'transcribed',
          transcript: `[Transcription placeholder for ${audioUrl}]`,
        })
        .eq('id', sermonId);
    });

    await step.sendEvent('content-ready', {
      name: 'sermon.transcribed',
      data: {
        sermonId,
        churchId: event.data.churchId,
        transcript: '[Transcription placeholder]',
        language: event.data.language,
      },
    });

    return { sermonId, status: 'transcribed' };
  }
);

export const generateContent = inngest.createFunction(
  { id: 'generate-content' },
  { event: 'sermon.transcribed' },
  async ({ event, step }) => {
    const { sermonId } = event.data;

    // TODO: Generate summary, discussion guide, devotional, social posts
    await step.run('save-summary', async () => {
      const admin = createAdminClient();
      await admin.from('content_assets').insert({
        sermon_id: sermonId,
        type: 'summary',
        language: event.data.language,
        content: '[Summary placeholder]',
        status: 'draft',
      });
    });

    return { sermonId, status: 'content_generated' };
  }
);
