import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import enMessages from '../../messages/en.json';
import esMessages from '../../messages/es.json';

const messagesByLocale: Record<string, typeof enMessages> = {
  en: enMessages,
  es: esMessages,
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as 'en' | 'es')) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: messagesByLocale[locale],
  };
});
