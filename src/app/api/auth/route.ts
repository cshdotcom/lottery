import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const COOKIE_NAME = 'lottery_session';
const SESSION_DURATION_DAYS = 7;

// 生成浏览器唯一标识
function generateBrowserId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(COOKIE_NAME);
    if (!cookie?.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = await prisma.userSession.findFirst({
      where: { id: cookie.value, expiresAt: { gt: new Date() } },
    });

    if (!session) {
      const response = NextResponse.json({ authenticated: false }, { status: 401 });
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        username: session.username,
        trustLevel: session.trustLevel,
        avatarUrl: session.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Session check failed:', error);
    return NextResponse.json(
      { error: 'Session check failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, apiConfigId } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const apiConfig = apiConfigId 
      ? await prisma.apiConfig.findFirst({ 
          where: { id: apiConfigId, isActive: true } 
        })
      : await prisma.apiConfig.findFirst({ 
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        });

    if (!apiConfig) {
      return NextResponse.json(
        { error: 'No active API configuration found' },
        { status: 400 }
      );
    }

    const userResponse = await fetch(
      `${apiConfig.baseUrl}/u/${encodeURIComponent(username)}.json`,
      {
        headers: {
          'Api-Key': apiConfig.apiKey,
          'Api-Username': 'system',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: 'User not found or authentication failed' },
        { status: 401 }
      );
    }

    const userData = await userResponse.json();
    const trustLevel = userData?.user?.trust_level ?? 0;
    const avatarUrl = userData?.user?.avatar_template 
      ? apiConfig.baseUrl + userData.user.avatar_template.replace('{size}', '120')
      : null;

    const browserId = generateBrowserId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

    await prisma.userSession.deleteMany({
      where: { browserId, username },
    });

    const session = await prisma.userSession.create({
      data: {
        username,
        trustLevel,
        avatarUrl,
        browserId,
        expiresAt,
      },
    });

    const response = NextResponse.json({
      authenticated: true,
      user: {
        username,
        trustLevel,
        avatarUrl,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: session.id,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    console.error('Authentication failed:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookie = request.cookies.get(COOKIE_NAME);
    if (cookie?.value) {
      await prisma.userSession.delete({ 
        where: { id: cookie.value } 
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete(COOKIE_NAME);
    return response;
  } catch (error) {
    console.error('Logout failed:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
