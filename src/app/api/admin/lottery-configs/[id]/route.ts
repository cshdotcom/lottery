import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const config = await prisma.lotteryConfig.findUnique({
      where: { id },
      include: { apiConfig: true },
    });

    if (!config) {
      return NextResponse.json({ error: '配置不存在' }, { status: 404 });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('获取抽奖配置失败:', error);
    return NextResponse.json({ error: '获取抽奖配置失败' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, winnersCount, requireLevel, requireLevelMin, autoPost, postCategory, apiConfigId } = body;

    const config = await prisma.lotteryConfig.update({
      where: { id },
      data: {
        name,
        description,
        winnersCount,
        requireLevel,
        requireLevelMin,
        autoPost,
        postCategory,
        apiConfigId,
      },
      include: { apiConfig: true },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('更新抽奖配置失败:', error);
    return NextResponse.json({ error: '更新抽奖配置失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.lotteryConfig.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除抽奖配置失败:', error);
    return NextResponse.json({ error: '删除抽奖配置失败' }, { status: 500 });
  }
}
