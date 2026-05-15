import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from './lib/prisma';

const ADMIN_PATHS = ['/admin/api-configs', '/admin/level-rules', '/admin/lottery-configs', '/admin/cdks', '/admin/lottery-records'];
const COOKIE_NAME = 'admin_session';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === '/admin/login') {
    const sessionId = request.cookies.get(COOKIE_NAME)?.value;
    if (sessionId) {
      try {
        const session = await prisma.userSession.findFirst({
          where: { id: sessionId, expiresAt: { gt: new Date() } },
        });
        if (session) {
          return NextResponse.redirect(new URL('/admin/api-configs', request.url));
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    }
    return NextResponse.next();
  }

  const isAdminPath = ADMIN_PATHS.some(path => pathname.startsWith(path));
  
  if (!isAdminPath) {
    return NextResponse.next();
  }

  const sessionId = request.cookies.get(COOKIE_NAME)?.value;

  if (!sessionId) {
    const url = new URL('/admin/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  try {
    const session = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    const url = new URL('/admin/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
