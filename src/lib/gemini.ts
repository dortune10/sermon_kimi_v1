/**
 * Gemini AI client for transcription and content generation.
 *
 * Uses Gemini 2.5 Flash-Lite for cost-effective long-form audio transcription.
 * Approx cost: ~$0.27/sermon at current rates (1 hour audio).
 *
 * Requires GEMINI_API_KEY environment variable.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  return new GoogleGenerativeAI(apiKey);
}

function getFileManager() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  return new GoogleAIFileManager(apiKey);
}

/**
 * Download audio from URL into a Buffer.
 */
async function downloadAudio(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download audio: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Transcribe audio using Gemini 2.5 Flash-Lite.
 *
 * Flow:
 * 1. Download audio from Supabase Storage
 * 2. Save to temp file
 * 3. Upload to Gemini's file manager
 * 4. Wait for file processing
 * 5. Generate transcript
 * 6. Clean up
 */
export async function transcribeAudio(audioUrl: string, language = 'en') {
  const client = getClient();
  const fileManager = getFileManager();
  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  // 1. Download audio
  const audioBuffer = await downloadAudio(audioUrl);

  // 2. Save to temp file (required for GoogleAIFileManager)
  const tempPath = join(tmpdir(), `sermon-${Date.now()}.mp3`);
  await writeFile(tempPath, audioBuffer);

  try {
    // 3. Upload to Gemini file manager
    const uploadResult = await fileManager.uploadFile(tempPath, {
      mimeType: 'audio/mp3',
      displayName: `sermon-${Date.now()}`,
    });

    const fileUri = uploadResult.file.uri;

    // 4. Wait for file processing (poll until ACTIVE)
    let fileState = uploadResult.file.state;
    let attempts = 0;
    const maxAttempts = 30; // ~5 minutes max

    while (fileState === 'PROCESSING' && attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 10000)); // 10s
      const fileInfo = await fileManager.getFile(uploadResult.file.name);
      fileState = fileInfo.state;
      attempts++;
    }

    if (fileState !== 'ACTIVE') {
      throw new Error(`Gemini file processing failed or timed out: ${fileState}`);
    }

    // 5. Generate transcript
    const prompt = language === 'es'
      ? 'Transcribe este sermón en español. Incluye marcas de tiempo opcionales si es útil. Transcripción completa y precisa:'
      : 'Transcribe this sermon accurately. Include optional timestamps if helpful. Full verbatim transcription:';

    const result = await model.generateContent([
      prompt,
      {
        fileData: {
          mimeType: 'audio/mp3',
          fileUri,
        },
      },
    ]);

    const transcript = result.response.text();

    // 6. Clean up Gemini file
    try {
      await fileManager.deleteFile(uploadResult.file.name);
    } catch {
      // Best-effort cleanup
    }

    return {
      transcript: transcript.trim(),
      language,
    };
  } finally {
    // Clean up temp file
    try {
      await unlink(tempPath);
    } catch {
      // Best-effort cleanup
    }
  }
}

/**
 * Generate a sermon summary from transcript.
 */
export async function generateSummary(transcript: string, language = 'en') {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const prompt = language === 'es'
    ? `Resume el siguiente sermón en español (3-4 párrafos, tono pastoral):

${transcript}`
    : `Summarize the following sermon in 3-4 paragraphs with a pastoral tone:

${transcript}`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Generate social media posts from transcript.
 */
export async function generateSocialPosts(transcript: string, language = 'en') {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const prompt = language === 'es'
    ? `Crea 3 publicaciones para redes sociales basadas en este sermón (una para Instagram/Facebook, una para Twitter/X, una para YouTube). En español, con emojis y hashtags relevantes:

${transcript}`
    : `Create 3 social media posts based on this sermon: one for Instagram/Facebook, one for Twitter/X, one for YouTube. Include emojis and relevant hashtags:

${transcript}`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Generate a discussion guide / study questions from transcript.
 */
export async function generateStudyGuide(transcript: string, language = 'en') {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const prompt = language === 'es'
    ? `Crea una guía de estudio bíblico con 5-7 preguntas de discusión basadas en este sermón. En español, con referencias bíblicas:

${transcript}`
    : `Create a Bible study discussion guide with 5-7 questions based on this sermon. Include scripture references:

${transcript}`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Detect scripture references in transcript.
 * Returns array of normalized references.
 */
export async function detectScriptureReferences(transcript: string, language = 'en') {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const prompt = language === 'es'
    ? `Extrae todas las referencias bíblicas mencionadas en este sermón. Devuélvelas como una lista JSON con formato: [{"book": "Juan", "chapter": 3, "verse_start": 16, "verse_end": null, "ref": "Juan 3:16"}]. Solo JSON, sin explicaciones:

${transcript}`
    : `Extract all Bible scripture references mentioned in this sermon. Return as a JSON array: [{"book": "John", "chapter": 3, "verse_start": 16, "verse_end": null, "ref": "John 3:16"}]. Only JSON, no explanation:

${transcript}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Try to parse JSON from the response
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as Array<{
        book: string;
        chapter: number;
        verse_start: number | null;
        verse_end: number | null;
        ref: string;
      }>;
    }
  } catch {
    // Fallback: return empty array
  }

  return [];
}
