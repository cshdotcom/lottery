import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function generateRandomCode(prefix: string, length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { count = 10, prefix = 'LOT', apiConfigId, createdBy } = body;

    if (count < 1 || count > 100) {
      return NextResponse.json(
        { error: '生成数量必须在1-100之间' },
        { status: 400 }
      );
    }

    const generatedCodes: string[] = [];
    let attempts = 0;
    const maxAttempts = count * 3;

    while (generatedCodes.length < count && attempts < maxAttempts) {
      const code = generateRandomCode(prefix);
      const existing = await prisma.cdk.findUnique({ where: { code } });
      if (!existing) {
        generatedCodes.push(code);
      }
      attempts++;
    }

    if (generatedCodes.length === 0) {
      return NextResponse.json(
        { error: '生成失败，请稍后重试' },
        { status: 500 }
      );
    }

    const cdks = await Promise.all(
      generatedCodes.map(code =>
        prisma.cdk.create({
          data: {
            code,
            name: `批量生成 - ${new Date().toLocaleDateString()}`,
            description: `系统批量生成，生成时间: ${new Date().toISOString()}`,
            cdkType: 'lottery',
            maxUses: 1,
            apiConfigId: apiConfigId || null,
            createdBy: createdBy || 'system',
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      count: cdks.length,
      codes: cdks.map(c => c.code),
      message: `成功生成 ${cdks.length} 个CDK`,
    });
  } catch (error) {
    console.error('批量生成CDK失败:', error);
    return NextResponse.json(
      { error: '批量生成CDK失败' },
      { status: 500 }
    );
  }
}
