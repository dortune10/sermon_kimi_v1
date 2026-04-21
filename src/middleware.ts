/**
 * Next.js middleware for SermonScriber.
 * - Protects dashboard, sermons, and workflow routes
 * - Handles auth redirects
 * - Manages locale-based routing via next-intl
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { routing } from '@/i18n/routing';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/sermons', '/workflow', '/sermon'];

// Auth routes that logged-in users should not access
const AUTH_ROUTES = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Determine locale from path (e.g., /en/dashboard -> en)
  const pathLocale = pathname.split('/')[1];
  const isValidLocale = routing.locales.includes(pathLocale as 'en' | 'es');

  // Redirect paths without locale prefix to default locale
  if (!isValidLocale) {
    const url = new URL(`/${routing.defaultLocale}${pathname}`, request.url);
    return NextResponse.redirect(url);
  }

  const locale = pathLocale;

  // Create a response object to attach cookies to
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Initialize Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if it exists
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if current path is protected
  const normalizedPath = pathname.replace(new RegExp(`^/${locale}`), '') || '/';
  const isProtected = PROTECTED_ROUTES.some((route) =>
    normalizedPath.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    normalizedPath.startsWith(route)
  );

  // Redirect unauthenticated users from protected routes to login
  if (isProtected && !user) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth routes to dashboard
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files, api routes, and _next
    '/((?!_next|api|.*\\..*).*)',
  ],
};
