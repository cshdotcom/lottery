import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const posted = searchParams.get('posted');

    const where = posted !== null ? { posted: posted === 'true' } : {};

    const records = await prisma.lotteryRecord.findMany({
      where,
      include: { apiConfig: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.lotteryRecord.count({ where });

    return NextResponse.json({ records, total, limit, offset });
  } catch (error) {
    console.error('获取抽奖记录失败:', error);
    return NextResponse.json({ error: '获取抽奖记录失败' }, { status: 500 });
  }
}
