import { NextResponse, type NextRequest } from 'next/server';

type JwtPayload = {
  role?: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN';
};

const AUTH_ROUTES = ['/login', '/register'];
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/favorites',
  '/orders',
  '/requests',
  '/portfolio',
  '/proposals',
  '/reports',
  '/professionals',
];

const ROLE_PREFIXES = {
  CLIENT: ['/favorites', '/orders', '/requests'],
  PROFESSIONAL: ['/portfolio', '/proposals'],
  ADMIN: ['/reports', '/professionals'],
} as const;

const matchesPrefix = (pathname: string, prefixes: readonly string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const decodeJwtPayload = (token?: string): JwtPayload | null => {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(atob(normalized)) as JwtPayload;
    return payload;
  } catch {
    return null;
  }
};

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const isAuthenticated = Boolean(accessToken || refreshToken);

  const isAuthRoute = matchesPrefix(pathname, AUTH_ROUTES);
  const isProtectedRoute = matchesPrefix(pathname, PROTECTED_PREFIXES);

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isProtectedRoute && accessToken) {
    const payload = decodeJwtPayload(accessToken);
    const role = payload?.role;

    if (role === 'CLIENT' && matchesPrefix(pathname, ROLE_PREFIXES.PROFESSIONAL)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (role === 'CLIENT' && matchesPrefix(pathname, ROLE_PREFIXES.ADMIN)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (role === 'PROFESSIONAL' && matchesPrefix(pathname, ROLE_PREFIXES.CLIENT)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (role === 'PROFESSIONAL' && matchesPrefix(pathname, ROLE_PREFIXES.ADMIN)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (role === 'ADMIN' && matchesPrefix(pathname, ROLE_PREFIXES.CLIENT)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (role === 'ADMIN' && matchesPrefix(pathname, ROLE_PREFIXES.PROFESSIONAL)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
