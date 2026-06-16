import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, locales } from './i18n';
import { API_BASE_URL } from './config';

type TokenPayload = {
  sub?: string;
  permissions?: string[];
};

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
});

// Short-lived per-city cache to avoid the blocking permissions fetch on every
// navigation. A block applied by an admin takes effect within this window.
const BLOCK_CHECK_COOKIE_PREFIX = 'ucb_';
const BLOCK_CHECK_TTL_SECONDS = 30;

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

const getCityIdFromPathname = (pathname: string): string | null => {
  const [, section, cityId] = pathname.split('/');

  if (section !== 'city' || !cityId) {
    return null;
  }

  return cityId;
};

const isCityBannedPath = (pathname: string, cityId: string): boolean =>
  pathname === `/city/${cityId}/banned`;

const isUserBlockedInCity = async (
  request: NextRequest,
  cityId: string,
): Promise<boolean> => {
  const accessToken = request.cookies.get('access_token')?.value;

  if (!accessToken) {
    return false;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/users/me/permissions?cityId=${encodeURIComponent(cityId)}`,
      {
        headers: {
          Cookie: `access_token=${accessToken}`,
        },
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { isBlocked?: boolean };
    return data.isBlocked === true;
  } catch {
    return false;
  }
};

function redirect(path: string, base: string): NextResponse {
  const url = new URL(path, base);
  url.port = '';
  return NextResponse.redirect(url);
}

function fixResponsePort(response: NextResponse): NextResponse {
  const location = response.headers.get('location');
  if (!location) return response;
  try {
    const url = new URL(location);
    if (url.port === '8080') {
      url.port = '';
      response.headers.set('location', url.toString());
    }
  } catch {}
  return response;
}

export default async function middleware(request: NextRequest) {
  console.log('[DEBUG] middleware hit:', request.nextUrl.pathname);
  console.log('[DEBUG] middleware API_BASE_URL:', API_BASE_URL);
  const localePrefix = getLocalePrefix(request.nextUrl.pathname);
  const pathname = stripLocalePrefix(request.nextUrl.pathname);
  const token = request.cookies.get('access_token')?.value;
  const payload = token ? decodeToken(token) : null;
  const isAuthenticated = Boolean(payload?.sub);

  const requiresAuth = AUTH_REQUIRED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (requiresAuth && !isAuthenticated) {
    return redirect(`${localePrefix}/user/auth`, request.url);
  }

  const cityId = getCityIdFromPathname(pathname);
  let verifiedNotBlocked = false;
  if (cityId && !isCityBannedPath(pathname, cityId)) {
    const recentlyVerified =
      request.cookies.get(`${BLOCK_CHECK_COOKIE_PREFIX}${cityId}`)?.value ===
      '1';
    if (!recentlyVerified) {
      if (await isUserBlockedInCity(request, cityId)) {
        return redirect(`${localePrefix}/city/${cityId}/banned`, request.url);
      }
      verifiedNotBlocked = true;
    }
  }

  const requiredPermission = PERMISSION_REQUIRED_ROUTES.find((entry) =>
    pathname.startsWith(entry.pathPrefix),
  )?.permission;

  if (
    requiredPermission &&
    !payload?.permissions?.includes(requiredPermission)
  ) {
    return redirect(`${localePrefix}/forbidden`, request.url);
  }

  const response = fixResponsePort(intlMiddleware(request));
  if (verifiedNotBlocked && cityId) {
    response.cookies.set(`${BLOCK_CHECK_COOKIE_PREFIX}${cityId}`, '1', {
      maxAge: BLOCK_CHECK_TTL_SECONDS,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
  }
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
