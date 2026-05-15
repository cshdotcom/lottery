import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const configs = await prisma.lotteryConfig.findMany({
      include: { apiConfig: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(configs);
  } catch (error) {
    console.error('获取抽奖配置失败:', error);
    return NextResponse.json({ error: '获取抽奖配置失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, winnersCount, requireLevel, requireLevelMin, autoPost, postCategory, apiConfigId } = body;

    if (!name) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    const config = await prisma.lotteryConfig.create({
      data: {
        name,
        description,
        winnersCount: winnersCount ?? 1,
        requireLevel: requireLevel ?? false,
        requireLevelMin: requireLevelMin ?? 1,
        autoPost: autoPost ?? false,
        postCategory: postCategory ?? 'announcements',
        apiConfigId,
      },
      include: { apiConfig: true },
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error('创建抽奖配置失败:', error);
    return NextResponse.json({ error: '创建抽奖配置失败' }, { status: 500 });
  }
}
