import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function pinTopic(topicId: number, apiConfig: { baseUrl: string; apiKey: string }) {
  try {
    const pinUrl = `${apiConfig.baseUrl}/t/${topicId}/status.json`;
    const response = await fetch(pinUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiConfig.apiKey,
        'Api-Username': 'system',
      },
      body: JSON.stringify({
        status: 'pinned',
        enabled: true,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('置顶失败:', error);
    return false;
  }
}

async function makePostWiki(postNumber: number, topicId: number, apiConfig: { baseUrl: string; apiKey: string }) {
  try {
    const wikiUrl = `${apiConfig.baseUrl}/posts/${postNumber}/wiki.json`;
    const response = await fetch(wikiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiConfig.apiKey,
        'Api-Username': 'system',
      },
      body: JSON.stringify({
        wiki: true,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('设为Wiki失败:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordId } = body;
    
    if (!recordId) {
      return NextResponse.json(
        { error: '缺少抽奖记录ID' },
        { status: 400 }
      );
    }
    
    const record = await prisma.lotteryRecord.findUnique({
      where: { id: recordId },
      include: { 
        apiConfig: true,
      },
    });
    
    if (!record) {
      return NextResponse.json(
        { error: '抽奖记录不存在' },
        { status: 404 }
      );
    }
    
    if (!record.apiConfig) {
      return NextResponse.json(
        { error: '未配置API，无法自动发帖' },
        { status: 400 }
      );
    }

    if (record.posted) {
      return NextResponse.json(
        { error: '此抽奖结果已发帖' },
        { status: 400 }
      );
    }

    const apiConfig = record.apiConfig;
    const topicId = parseInt(record.topicId);
    
    const winners = record.winners.split(',').map((w, i) => {
      const [floor, username] = w.split(':');
      return { rank: i + 1, floor: parseInt(floor), username };
    });

    const postContent = `🎉 **【抽奖结果公布】**

---

**恭喜以下 ${record.winnersCount} 位幸运用户！**

${winners.map(w => `${w.rank}. **@${w.username}** - ${w.floor}楼`).join('\n')}

---

**📋 抽奖信息**
- 📌 原帖: ${record.topicUrl}
- 👥 参与楼层: ${record.totalParticipants} 楼
- 🎯 中奖人数: ${record.winnersCount} 人
- 🔐 最终种子: \`${record.seed}\`
- ⏰ 抽奖时间: ${new Date(record.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

---

*本结果由系统自动生成，公开透明可验证* 🎊`;

    const postUrl = `${apiConfig.baseUrl}/posts.json`;
    
    const postData = {
      topic_id: topicId,
      raw: postContent,
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
    
    const fullPostUrl = `${apiConfig.baseUrl}/t/${record.topicId}/${postResult.post_number}`;
    
    await prisma.lotteryRecord.update({
      where: { id: recordId },
      data: {
        posted: true,
        postUrl: fullPostUrl,
      },
    });
    
    return NextResponse.json({
      success: true,
      postUrl: fullPostUrl,
      postNumber: postResult.post_number,
      message: '已在原帖下回复',
    });
  } catch (error) {
    console.error('自动发帖失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '自动发帖失败' },
      { status: 500 }
    );
  }
}
