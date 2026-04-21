/**
 * Inngest client instance for SermonScriber.
 * Used to send events and define background functions.
 */

import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'sermonscriber-v2',
  eventKey: process.env.INNGEST_EVENT_KEY,
});
