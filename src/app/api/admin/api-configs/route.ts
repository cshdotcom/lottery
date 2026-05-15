import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const configs = await prisma.apiConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(configs);
  } catch (error) {
    console.error('获取API配置失败:', error);
    return NextResponse.json({ error: '获取API配置失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, baseUrl, apiKey, category, isActive } = body;

    if (!name || !baseUrl || !apiKey) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    const config = await prisma.apiConfig.create({
      data: {
        name,
        description,
        baseUrl,
        apiKey,
        category: category || 'discourse',
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error('创建API配置失败:', error);
    return NextResponse.json({ error: '创建API配置失败' }, { status: 500 });
  }
}
