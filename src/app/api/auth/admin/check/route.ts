import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const COOKIE_NAME = 'admin_session';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(COOKIE_NAME)?.value;

    if (!sessionId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      const response = NextResponse.json({ authenticated: false }, { status: 401 });
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error('Admin session check failed:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    );
  }
}
