import { NextResponse } from 'next/server';

export function middleware(request) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // tours.citytourguide.app → serve site with tours pre-filtered
  if (hostname.startsWith('tours.')) {
    if (url.pathname === '/') {
      url.searchParams.set('category', 'Tours & Activities');
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
