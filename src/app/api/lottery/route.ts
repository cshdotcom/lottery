import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

async function fetchTopicInfo(topicUrl: string, apiConfig: { baseUrl: string; apiKey: string }) {
  const topicIdMatch = topicUrl.match(/\/t\/[^/]+\/(\d+)/);
  if (!topicIdMatch) {
    throw new Error('无法从URL中解析出主题ID');
  }
  
  const topicId = topicIdMatch[1];
  const jsonUrl = `${apiConfig.baseUrl}/t/${topicId}.json`;
  
  const response = await fetch(jsonUrl, {
    headers: {
      'Api-Key': apiConfig.apiKey,
      'Api-Username': 'system',
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`获取主题信息失败: ${response.status}`);
  }
  
  const data = await response.json();
  
  return {
    topicId,
    title: data.title,
    createdAt: data.created_at,
    createdBy: data.details?.created_by?.username || 'unknown',
    postsCount: data.posts_count || 0,
    baseUrl: apiConfig.baseUrl,
  };
}

async function fetchAllPosts(topicId: string, apiConfig: { baseUrl: string; apiKey: string }) {
  const allPosts: Array<{ post_number: number; username: string; created_at: string }> = [];
  let page = 0;
  const perPage = 30;
  
  while (true) {
    const postsUrl = `${apiConfig.baseUrl}/t/${topicId}/posts.json?offset=${page * perPage}`;
    
    const response = await fetch(postsUrl, {
      headers: {
        'Api-Key': apiConfig.apiKey,
        'Api-Username': 'system',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`获取帖子回复失败: ${response.status}`);
    }
    
    const data = await response.json();
    const posts = data.post_stream?.posts || [];
    
    if (posts.length === 0) break;
    
    for (const post of posts) {
      if (post.post_number > 1) {
        allPosts.push({
          post_number: post.post_number,
          username: post.username,
          created_at: post.created_at,
        });
      }
    }
    
    page++;
    
    if (posts.length < perPage) break;
  }
  
  return allPosts;
}

function generateSeed(topicInfo: any, posts: any[], winnersCount: number): string {
  const seedContent = [
    winnersCount.toString(),
    topicInfo.topicId,
    topicInfo.createdBy,
    topicInfo.createdAt,
    posts.map(p => `${p.post_number}:${p.username}`).join(','),
    posts.length.toString(),
  ].join('|');
  
  const md5Hash = crypto.createHash('md5').update(seedContent).digest('hex');
  const sha1Hash = crypto.createHash('sha1').update(seedContent).digest('hex');
  const sha512Hash = crypto.createHash('sha512').update(seedContent).digest('hex');
  
  return crypto
    .createHash('sha256')
    .update(md5Hash + sha1Hash + sha512Hash)
    .digest('hex');
}

function generateWinners(seed: string, posts: any[], winnersCount: number): any[] {
  const seedNum = parseInt(seed.substring(0, 8), 16);
  const winners: any[] = [];
  let availablePosts = [...posts];
  
  let state = seedNum;
  for (let i = 0; i < winnersCount && availablePosts.length > 0; i++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const index = state % availablePosts.length;
    winners.push(availablePosts[index]);
    availablePosts.splice(index, 1);
  }
  
  return winners;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicUrl, configId, lastFloor } = body;
    
    if (!topicUrl) {
      return NextResponse.json(
        { error: '缺少帖子链接' },
        { status: 400 }
      );
    }

    const config = await prisma.lotteryConfig.findUnique({
      where: { id: configId },
      include: { apiConfig: true, levelRule: true },
    });

    if (!config || !config.apiConfig) {
      return NextResponse.json(
        { error: '抽奖配置不存在或未配置API' },
        { status: 400 }
      );
    }

    const apiConfig = config.apiConfig;
    
    try {
      const topicUrlObj = new URL(topicUrl);
      const configUrlObj = new URL(apiConfig.baseUrl);
      
      if (topicUrlObj.hostname !== configUrlObj.hostname) {
        return NextResponse.json(
          { error: `帖子域名不匹配，请使用 ${configUrlObj.hostname} 的帖子` },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: '帖子链接格式不正确' },
        { status: 400 }
      );
    }

    const topicInfo = await fetchTopicInfo(topicUrl, apiConfig);
    let allPosts = await fetchAllPosts(topicInfo.topicId, apiConfig);

    if (lastFloor && lastFloor > 0) {
      allPosts = allPosts.filter(p => p.post_number <= lastFloor);
    }

    if (allPosts.length === 0) {
      return NextResponse.json(
        { error: '没有有效的回复楼层' },
        { status: 400 }
      );
    }

    const winnersCount = Math.min(config.winnersCount, allPosts.length);
    const seed = generateSeed(topicInfo, allPosts, winnersCount);
    const winners = generateWinners(seed, allPosts, winnersCount);

    const record = await prisma.lotteryRecord.create({
      data: {
        topicId: topicInfo.topicId,
        topicUrl: topicUrl,
        topicTitle: topicInfo.title,
        author: topicInfo.createdBy,
        winnersCount: winnersCount,
        winners: winners.map(w => `${w.post_number}:${w.username}`).join(','),
        seed: seed,
        totalParticipants: allPosts.length,
        apiConfigId: apiConfig.id,
        posted: false,
      },
    });

    return NextResponse.json({
      success: true,
      record: {
        id: record.id,
        topicTitle: topicInfo.title,
        topicUrl: topicUrl,
        author: topicInfo.createdBy,
        winners: winners.map((w, i) => ({
          rank: i + 1,
          floor: w.post_number,
          username: w.username,
        })),
        totalParticipants: allPosts.length,
        winnersCount: winnersCount,
        seed: seed,
        config: {
          name: config.name,
          winnersCount: config.winnersCount,
          autoPost: config.autoPost,
        },
      },
    });
  } catch (error) {
    console.error('抽奖失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '抽奖失败' },
      { status: 500 }
    );
  }
}
