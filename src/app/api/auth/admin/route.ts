import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const COOKIE_NAME = 'admin_session';
const ADMIN_USERNAME = 'cshll';
const ADMIN_PASSWORD = '15068253855z';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const session = await prisma.userSession.create({
        data: {
          username: 'admin',
          trustLevel: 4,
          browserId: 'admin-login',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const response = NextResponse.json({
        authenticated: true,
        user: {
          username: 'admin',
          trustLevel: 4,
        },
      });

      response.cookies.set({
        name: COOKIE_NAME,
        value: session.id,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return response;
    }

    return NextResponse.json(
      { authenticated: false, error: '账号或密码错误' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Admin login failed:', error);
    return NextResponse.json(
      { error: '登录失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookie = request.cookies.get(COOKIE_NAME);
    if (cookie?.value) {
      await prisma.userSession.delete({
        where: { id: cookie.value },
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete(COOKIE_NAME);
    return response;
  } catch (error) {
    console.error('Logout failed:', error);
    return NextResponse.json(
      { error: '退出失败' },
      { status: 500 }
    );
  }
}
