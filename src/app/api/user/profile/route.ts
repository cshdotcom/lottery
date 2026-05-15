import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');
    const apiConfigId = searchParams.get('apiConfigId');

    if (!username) {
      return NextResponse.json({ error: '用户名不能为空' }, { status: 400 });
    }

    let apiConfig = null;
    if (apiConfigId) {
      apiConfig = await prisma.apiConfig.findFirst({
        where: { id: apiConfigId, isActive: true },
      });
    } else {
      apiConfig = await prisma.apiConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!apiConfig) {
      return NextResponse.json({ 
        error: '没有可用的API配置',
        cached: false 
      }, { status: 400 });
    }

    const cachedProfile = await prisma.userProfile.findFirst({
      where: { 
        username, 
        apiConfigId: apiConfig.id,
        lastChecked: { gt: new Date(Date.now() - 1000 * 60 * 30) }
      },
    });

    if (cachedProfile) {
      return NextResponse.json({
        ...cachedProfile,
        cached: true,
      });
    }

    try {
      const response = await fetch(
        `${apiConfig.baseUrl}/u/${encodeURIComponent(username)}.json`,
        {
          headers: {
            'Api-Key': apiConfig.apiKey,
            'Api-Username': 'system',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json({ 
            error: '用户不存在',
            cached: false 
          }, { status: 404 });
        }
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();
      const userData = data.user;

      const profile = await prisma.userProfile.upsert({
        where: {
          username_apiConfigId: {
            username,
            apiConfigId: apiConfig.id,
          },
        },
        update: {
          discourseId: String(userData.id),
          trustLevel: userData.trust_level || 0,
          avatarUrl: userData.avatar_template 
            ? apiConfig.baseUrl + userData.avatar_template.replace('{size}', '120')
            : null,
          bio: userData.bio_raw || null,
          joinedAt: userData.created_at ? new Date(userData.created_at) : null,
          postCount: userData.post_count || 0,
          lastChecked: new Date(),
        },
        create: {
          username,
          discourseId: String(userData.id),
          trustLevel: userData.trust_level || 0,
          avatarUrl: userData.avatar_template 
            ? apiConfig.baseUrl + userData.avatar_template.replace('{size}', '120')
            : null,
          bio: userData.bio_raw || null,
          joinedAt: userData.created_at ? new Date(userData.created_at) : null,
          postCount: userData.post_count || 0,
          apiConfigId: apiConfig.id,
          lastChecked: new Date(),
        },
      });

      return NextResponse.json({
        ...profile,
        cached: false,
      });
    } catch (error) {
      console.error('获取用户资料失败:', error);
      return NextResponse.json({ 
        error: '获取用户资料失败',
        cached: false 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('用户资料API错误:', error);
    return NextResponse.json({ 
      error: '服务器错误',
      cached: false 
    }, { status: 500 });
  }
}
