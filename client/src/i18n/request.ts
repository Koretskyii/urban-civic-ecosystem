import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales } from './index';
import { uk } from './uk';
import { en } from './en';

const messagesByLocale = {
  uk,
  en,
} as const;

export default getRequestConfig(async ({ locale }) => {
  const safeLocale = locales.includes(locale as (typeof locales)[number])
    ? (locale as keyof typeof messagesByLocale)
    : defaultLocale;

  return {
    locale: safeLocale,
    messages: messagesByLocale[safeLocale],
  };
});
