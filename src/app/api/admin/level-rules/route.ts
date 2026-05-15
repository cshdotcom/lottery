import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const rules = await prisma.levelRule.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error('获取等级规则失败:', error);
    return NextResponse.json({ error: '获取等级规则失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, minLevel, category, isActive, priority } = body;

    if (!name || minLevel === undefined) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    const rule = await prisma.levelRule.create({
      data: {
        name,
        description,
        minLevel,
        category: category || 'trust_level',
        isActive: isActive ?? true,
        priority: priority ?? 0,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('创建等级规则失败:', error);
    return NextResponse.json({ error: '创建等级规则失败' }, { status: 500 });
  }
}
