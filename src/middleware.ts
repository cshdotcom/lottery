import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from './lib/prisma';

const ADMIN_PATHS = ['/admin'];
const COOKIE_NAME = 'lottery_session';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isAdminPath = ADMIN_PATHS.some(path => pathname.startsWith(path));
  
  if (!isAdminPath && pathname !== '/login') {
    return NextResponse.next();
  }

  const sessionId = request.cookies.get(COOKIE_NAME)?.value;

  if (!sessionId) {
    if (pathname !== '/login') {
      const url = new URL('/login', request.url);
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  try {
    const session = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      const response = pathname === '/login' 
        ? NextResponse.next() 
        : NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    if (isAdminPath && session.trustLevel < 2) {
      return new NextResponse('权限不足', { status: 403 });
    }

    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    const url = new URL('/login', request.url);
    if (pathname !== '/login') {
      url.searchParams.set('from', pathname);
    }
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
