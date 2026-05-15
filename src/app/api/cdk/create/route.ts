import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_COOKIE = 'admin_session';
const USER_COOKIE = 'lottery_session';

function generateRandomCode(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const adminSessionId = request.cookies.get(ADMIN_COOKIE)?.value;
    const userSessionId = request.cookies.get(USER_COOKIE)?.value;

    let username = 'anonymous';
    let isAdmin = false;

    if (adminSessionId) {
      const adminSession = await prisma.userSession.findFirst({
        where: {
          id: adminSessionId,
          expiresAt: { gt: new Date() },
        },
      });
      if (adminSession) {
        username = adminSession.username;
        isAdmin = true;
      }
    } else if (userSessionId) {
      const userSession = await prisma.userSession.findFirst({
        where: {
          id: userSessionId,
          expiresAt: { gt: new Date() },
        },
      });
      if (userSession) {
        username = userSession.username;
      }
    }

    if (username === 'anonymous') {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, count = 1 } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '请输入有效的CDK名称' },
        { status: 400 }
      );
    }

    const generateCount = Math.min(Math.max(parseInt(count) || 1, 1), 100);

    const codes: string[] = [];
    let attempts = 0;
    const maxAttempts = generateCount * 3;

    while (codes.length < generateCount && attempts < maxAttempts) {
      const randomPart = generateRandomCode();
      const code = `CDK-${randomPart}`;
      
      const existing = await prisma.cdk.findUnique({ where: { code } });
      if (!existing) {
        codes.push(code);
      }
      attempts++;
    }

    if (codes.length === 0) {
      return NextResponse.json(
        { success: false, error: '生成失败，请稍后重试' },
        { status: 500 }
      );
    }

    const cdks = await Promise.all(
      codes.map(code =>
        prisma.cdk.create({
          data: {
            code,
            name: name.trim(),
            description: description?.trim() || null,
            cdkType: 'user_created',
            maxUses: 1,
            expiresAt: null,
            createdBy: username,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      count: cdks.length,
      codes: cdks.map(c => c.code),
      message: `成功创建 ${cdks.length} 个CDK`,
      createdBy: username,
      isAdmin,
    });
  } catch (error) {
    console.error('创建CDK失败:', error);
    return NextResponse.json(
      { success: false, error: '创建失败，请稍后重试' },
      { status: 500 }
    );
  }
}
