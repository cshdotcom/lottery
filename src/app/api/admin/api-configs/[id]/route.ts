import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const config = await prisma.apiConfig.findUnique({
      where: { id },
    });

    if (!config) {
      return NextResponse.json({ error: '配置不存在' }, { status: 404 });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('获取API配置失败:', error);
    return NextResponse.json({ error: '获取API配置失败' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, baseUrl, apiKey, category, isActive } = body;

    const config = await prisma.apiConfig.update({
      where: { id },
      data: {
        name,
        description,
        baseUrl,
        apiKey,
        category,
        isActive,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('更新API配置失败:', error);
    return NextResponse.json({ error: '更新API配置失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.apiConfig.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除API配置失败:', error);
    return NextResponse.json({ error: '删除API配置失败' }, { status: 500 });
  }
}
