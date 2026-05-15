import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const apiConfigId = searchParams.get('apiConfigId');
    const cdkType = searchParams.get('cdkType');

    const where: any = {};
    if (apiConfigId) where.apiConfigId = apiConfigId;
    if (cdkType) where.cdkType = cdkType;

    const cdks = await prisma.cdk.findMany({
      where,
      include: {
        apiConfig: true,
        usages: {
          include: { userProfile: true },
          orderBy: { usedAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(cdks);
  } catch (error) {
    console.error('获取CDK列表失败:', error);
    return NextResponse.json({ error: '获取CDK列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, description, cdkType, maxUses, expiresAt, apiConfigId, createdBy } = body;

    if (!code || !name) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    const existing = await prisma.cdk.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json({ error: 'CDK已存在' }, { status: 400 });
    }

    const cdk = await prisma.cdk.create({
      data: {
        code,
        name,
        description,
        cdkType: cdkType || 'lottery',
        maxUses: maxUses || 1,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        apiConfigId,
        createdBy,
      },
      include: { apiConfig: true },
    });

    return NextResponse.json(cdk, { status: 201 });
  } catch (error) {
    console.error('创建CDK失败:', error);
    return NextResponse.json({ error: '创建CDK失败' }, { status: 500 });
  }
}
