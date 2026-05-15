import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdk = await prisma.cdk.findUnique({
      where: { id },
      include: {
        apiConfig: true,
        usages: {
          include: { userProfile: true },
          orderBy: { usedAt: 'desc' },
        },
      },
    });

    if (!cdk) {
      return NextResponse.json({ error: 'CDK不存在' }, { status: 404 });
    }

    return NextResponse.json(cdk);
  } catch (error) {
    console.error('获取CDK详情失败:', error);
    return NextResponse.json({ error: '获取CDK详情失败' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, cdkType, maxUses, expiresAt, isActive } = body;

    const cdk = await prisma.cdk.update({
      where: { id },
      data: {
        name,
        description,
        cdkType,
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive,
      },
      include: { apiConfig: true },
    });

    return NextResponse.json(cdk);
  } catch (error) {
    console.error('更新CDK失败:', error);
    return NextResponse.json({ error: '更新CDK失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.cdkUsage.deleteMany({ where: { cdkId: id } });
    await prisma.cdk.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除CDK失败:', error);
    return NextResponse.json({ error: '删除CDK失败' }, { status: 500 });
  }
}
