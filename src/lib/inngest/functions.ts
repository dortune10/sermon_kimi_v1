import { inngest } from './client';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  transcribeAudio,
  generateSummary,
  generateSocialPosts,
  generateStudyGuide,
  detectScriptureReferences,
} from '@/lib/gemini';

export const transcribeSermon = inngest.createFunction(
  { id: 'transcribe-sermon' },
  { event: 'sermon.uploaded' },
  async ({ event, step }) => {
    const { sermonId, audioUrl, language } = event.data;

    await step.run('update-status-processing', async () => {
      const admin = createAdminClient();
      await admin.from('sermons').update({ status: 'processing' }).eq('id', sermonId);
    });

    // Transcribe audio with Gemini
    const { transcript } = await step.run('transcribe-audio', async () => {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
      }
      return transcribeAudio(audioUrl, language);
    });

    // Update sermon with transcript
    await step.run('save-transcript', async () => {
      const admin = createAdminClient();
      await admin
        .from('sermons')
        .update({ status: 'transcribed', transcript })
        .eq('id', sermonId);
    });

    // Detect scripture references
    const references = await step.run('detect-scriptures', async () => {
      if (!process.env.GEMINI_API_KEY) return [];
      return detectScriptureReferences(transcript, language);
    });

    if (references.length > 0) {
      await step.run('save-scripture-refs', async () => {
        const admin = createAdminClient();
        await admin.from('scripture_references').insert(
          references.map((ref) => ({
            sermon_id: sermonId,
            book: ref.book,
            chapter: ref.chapter,
            verse_start: ref.verse_start,
            verse_end: ref.verse_end,
            normalized_ref: ref.ref,
            detected_text: ref.ref,
            language,
          }))
        );
      });
    }

    // Trigger content generation
    await step.sendEvent('content-ready', {
      name: 'sermon.transcribed',
      data: {
        sermonId,
        churchId: event.data.churchId,
        transcript,
        language,
      },
    });

    return { sermonId, status: 'transcribed', referenceCount: references.length };
  }
);

export const generateContent = inngest.createFunction(
  { id: 'generate-content' },
  { event: 'sermon.transcribed' },
  async ({ event, step }) => {
    const { sermonId, transcript, language } = event.data;

    // Generate summary
    const summary = await step.run('generate-summary', async () => {
      if (!process.env.GEMINI_API_KEY) return '[Summary placeholder — Gemini not configured]';
      return generateSummary(transcript, language);
    });

    await step.run('save-summary', async () => {
      const admin = createAdminClient();
      await admin.from('content_assets').insert({
        sermon_id: sermonId,
        type: 'summary',
        language,
        content: summary,
        status: 'published',
      });
    });

    // Generate social media posts
    const socialPosts = await step.run('generate-social-posts', async () => {
      if (!process.env.GEMINI_API_KEY) return '[Social posts placeholder — Gemini not configured]';
      return generateSocialPosts(transcript, language);
    });

    await step.run('save-social-posts', async () => {
      const admin = createAdminClient();
      await admin.from('content_assets').insert({
        sermon_id: sermonId,
        type: 'social_post',
        language,
        content: socialPosts,
        status: 'published',
      });
    });

    // Generate study guide
    const studyGuide = await step.run('generate-study-guide', async () => {
      if (!process.env.GEMINI_API_KEY) return '[Study guide placeholder — Gemini not configured]';
      return generateStudyGuide(transcript, language);
    });

    await step.run('save-study-guide', async () => {
      const admin = createAdminClient();
      await admin.from('content_assets').insert({
        sermon_id: sermonId,
        type: 'study_guide',
        language,
        content: studyGuide,
        status: 'published',
      });
    });

    // Mark sermon as completed
    await step.run('mark-completed', async () => {
      const admin = createAdminClient();
      await admin.from('sermons').update({ status: 'completed' }).eq('id', sermonId);
    });

    return { sermonId, status: 'completed' };
  }
);
