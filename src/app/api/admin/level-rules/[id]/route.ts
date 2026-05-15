import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rule = await prisma.levelRule.findUnique({
      where: { id },
    });

    if (!rule) {
      return NextResponse.json({ error: '规则不存在' }, { status: 404 });
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error('获取等级规则失败:', error);
    return NextResponse.json({ error: '获取等级规则失败' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, minLevel, category, isActive, priority } = body;

    const rule = await prisma.levelRule.update({
      where: { id },
      data: {
        name,
        description,
        minLevel,
        category,
        isActive,
        priority,
      },
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error('更新等级规则失败:', error);
    return NextResponse.json({ error: '更新等级规则失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.levelRule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除等级规则失败:', error);
    return NextResponse.json({ error: '删除等级规则失败' }, { status: 500 });
  }
}
