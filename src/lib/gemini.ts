/**
 * Gemini AI client for transcription and content generation.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function transcribeAudio(audioUrl: string, language?: string) {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  // TODO: Download audio and send to Gemini for transcription
  // For now, return a placeholder
  return {
    transcript: `[Transcript placeholder for ${audioUrl}]`,
    language: language || 'en',
  };
}

export async function generateSummary(transcript: string, language: string) {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const prompt = language === 'es'
    ? `Resume el siguiente sermón en español:\n\n${transcript}`
    : `Summarize the following sermon:\n\n${transcript}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
