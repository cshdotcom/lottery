import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, username, apiConfigId } = body;

    if (!code) {
      return NextResponse.json({ error: 'CDK不能为空' }, { status: 400 });
    }

    if (!username) {
      return NextResponse.json({ error: '用户名不能为空' }, { status: 400 });
    }

    const cdk = await prisma.cdk.findUnique({
      where: { code },
      include: { apiConfig: true },
    });

    if (!cdk) {
      return NextResponse.json({ 
        success: false, 
        error: 'CDK不存在' 
      }, { status: 404 });
    }

    if (!cdk.isActive) {
      return NextResponse.json({ 
        success: false, 
        error: 'CDK已被禁用' 
      }, { status: 400 });
    }

    if (cdk.expiresAt && new Date(cdk.expiresAt) < new Date()) {
      return NextResponse.json({ 
        success: false, 
        error: 'CDK已过期' 
      }, { status: 400 });
    }

    if (cdk.usedCount >= cdk.maxUses) {
      return NextResponse.json({ 
        success: false, 
        error: 'CDK已被用完' 
      }, { status: 400 });
    }

    const existingUsage = await prisma.cdkUsage.findFirst({
      where: { cdkId: cdk.id, username },
      include: { cdk: true },
    });

    if (existingUsage) {
      return NextResponse.json({ 
        success: false, 
        error: '您已经使用过此CDK',
        cdk: cdk 
      }, { status: 400 });
    }

    let userProfile = null;
    if (cdk.apiConfigId) {
      userProfile = await prisma.userProfile.findFirst({
        where: { username, apiConfigId: cdk.apiConfigId },
      });
    } else {
      userProfile = await prisma.userProfile.findFirst({
        where: { username },
      });
    }

    const usage = await prisma.cdkUsage.create({
      data: {
        cdkId: cdk.id,
        username,
        userProfileId: userProfile?.id,
      },
      include: { cdk: true },
    });

    await prisma.cdk.update({
      where: { id: cdk.id },
      data: { usedCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      message: 'CDK验证成功',
      cdk: {
        id: cdk.id,
        name: cdk.name,
        description: cdk.description,
        cdkType: cdk.cdkType,
      },
      usage: {
        usedAt: usage.usedAt,
      },
    });
  } catch (error) {
    console.error('CDK验证失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'CDK验证失败' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: '缺少CDK参数' }, { status: 400 });
    }

    const cdk = await prisma.cdk.findUnique({
      where: { code },
      include: { apiConfig: true },
    });

    if (!cdk) {
      return NextResponse.json({ 
        valid: false,
        error: 'CDK不存在' 
      }, { status: 404 });
    }

    if (!cdk.isActive) {
      return NextResponse.json({ 
        valid: false,
        error: 'CDK已被禁用' 
      });
    }

    if (cdk.expiresAt && new Date(cdk.expiresAt) < new Date()) {
      return NextResponse.json({ 
        valid: false,
        error: 'CDK已过期' 
      });
    }

    return NextResponse.json({
      valid: true,
      remainingUses: cdk.maxUses - cdk.usedCount,
      name: cdk.name,
      description: cdk.description,
    });
  } catch (error) {
    console.error('CDK查询失败:', error);
    return NextResponse.json({ 
      valid: false,
      error: '查询失败' 
    }, { status: 500 });
  }
}
