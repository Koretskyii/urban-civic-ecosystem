import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, locales } from './i18n';

type TokenPayload = {
  sub?: string;
  permissions?: string[];
};

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
});

const AUTH_REQUIRED_PREFIXES = ['/city', '/user/profile'];
const PERMISSION_REQUIRED_ROUTES: Array<{
  pathPrefix: string;
  permission: string;
}> = [];

const decodeToken = (token: string): TokenPayload | null => {
  try {
    const [, payloadPart] = token.split('.');
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const payloadJson = atob(padded);
    return JSON.parse(payloadJson) as TokenPayload;
  } catch {
    return null;
  }
};

const stripLocalePrefix = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return '/';
  if (locales.includes(segments[0] as (typeof locales)[number])) {
    return `/${segments.slice(1).join('/')}` || '/';
  }
  return pathname;
};

const getLocalePrefix = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0];
  if (locale && locales.includes(locale as (typeof locales)[number])) {
    return `/${locale}`;
  }
  return `/${defaultLocale}`;
};

export default function middleware(request: NextRequest) {
  const localePrefix = getLocalePrefix(request.nextUrl.pathname);
  const pathname = stripLocalePrefix(request.nextUrl.pathname);
  const token = request.cookies.get('access_token')?.value;
  const payload = token ? decodeToken(token) : null;
  const isAuthenticated = Boolean(payload?.sub);

  const requiresAuth = AUTH_REQUIRED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (requiresAuth && !isAuthenticated) {
    return NextResponse.redirect(
      new URL(`${localePrefix}/user/auth`, request.url),
    );
  }

  const requiredPermission = PERMISSION_REQUIRED_ROUTES.find((entry) =>
    pathname.startsWith(entry.pathPrefix),
  )?.permission;

  if (
    requiredPermission &&
    !payload?.permissions?.includes(requiredPermission)
  ) {
    return NextResponse.redirect(
      new URL(`${localePrefix}/forbidden`, request.url),
    );
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
