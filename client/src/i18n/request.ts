import { getRequestConfig } from 'next-intl/server';
import { uk } from './uk';

export default getRequestConfig(async () => ({
  locale: 'uk',
  messages: uk,
}));
