import { createNavigation } from 'next-intl/navigation';
import { defaultLocale, locales } from './index';

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  defaultLocale,
});
