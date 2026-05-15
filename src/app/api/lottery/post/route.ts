import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordId, content } = body;
    
    if (!recordId || !content) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }
    
    const record = await prisma.lotteryRecord.findUnique({
      where: { id: recordId },
      include: { apiConfig: true },
    });
    
    if (!record) {
      return NextResponse.json(
        { error: '抽奖记录不存在' },
        { status: 404 }
      );
    }
    
    const apiConfig = record.apiConfig;
    if (!apiConfig) {
      return NextResponse.json(
        { error: '未配置API，无法自动发帖' },
        { status: 400 }
      );
    }
    
    const postUrl = `${apiConfig.baseUrl}/posts.json`;
    
    const postData = {
      title: `【抽奖结果】${record.topicTitle}`,
      raw: content,
      category: record.apiConfigId ? undefined : 1,
      reply_to_post_number: null,
    };
    
    const response = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiConfig.apiKey,
        'Api-Username': 'system',
      },
      body: JSON.stringify(postData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errors?.[0] || `发帖失败: ${response.status}`);
    }
    
    const postResult = await response.json();
    
    await prisma.lotteryRecord.update({
      where: { id: recordId },
      data: {
        posted: true,
        postUrl: `${apiConfig.baseUrl}/t/${postResult.topic_slug}/${postResult.topic_id}/${postResult.post_number}`,
      },
    });
    
    return NextResponse.json({
      success: true,
      postUrl: `${apiConfig.baseUrl}/t/${postResult.topic_slug}/${postResult.topic_id}/${postResult.post_number}`,
      postNumber: postResult.post_number,
    });
  } catch (error) {
    console.error('自动发帖失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '自动发帖失败' },
      { status: 500 }
    );
  }
}
