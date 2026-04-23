import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { transcribeSermon, generateContent } from '@/lib/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [transcribeSermon, generateContent],
  servePath: '/api/jobs',
});

// Handle CORS preflight requests from Inngest dashboard
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Inngest-Server-Kind, X-Inngest-Expected-Server-Kind',
    },
  });
}
