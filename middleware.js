// middleware.js — Protects whole site with Basic Auth + /admin routes with password auth
import { NextResponse } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'citytourguide2026';
const COOKIE_NAME  = 'ctg_admin_auth';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Site-wide Basic Authentication (Stops public viewing before launch)
  const sitePassword = process.env.SITE_PASSWORD || 'mptampa2026';
  const basicAuth = request.headers.get('authorization');

  // Skip auth for static assets just in case, though the matcher should handle it
  if (!basicAuth) {
    return new NextResponse('Authentication required to view site.', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="City Tour Guide Preview"' }
    });
  }

  const authValue = basicAuth.split(' ')[1];
  const [user, pwd] = atob(authValue).split(':');

  if (user !== 'admin' || pwd !== sitePassword) {
    return new NextResponse('Invalid credentials.', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="City Tour Guide Preview"' }
    });
  }
  // 2. Only protect /admin routes (not /admin/login) with the dashboard cookie
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token !== ADMIN_SECRET) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes EXCEPT static assets, images, next.js internals, and crawler bots APIs
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
