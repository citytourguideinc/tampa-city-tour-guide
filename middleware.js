// middleware.js — Protects /admin routes with password auth
import { NextResponse } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'ctg-admin-secure';
const COOKIE_NAME  = 'ctg_admin_auth';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (not /admin/login)
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
  matcher: ['/admin/:path*'],
};
