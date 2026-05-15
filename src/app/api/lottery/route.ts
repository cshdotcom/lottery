import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 10;

const requestCounts = new Map<string, { count: number; timestamp: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    requestCounts.set(ip, { count: 1, timestamp: now });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}

function validateTopicUrl(url: string, allowedDomain: string): boolean {
  try {
    const urlObj = new URL(url);
    const domainObj = new URL(allowedDomain);
    return urlObj.hostname === domainObj.hostname;
  } catch {
    return false;
  }
}

function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

async function fetchTopicInfo(topicUrl: string, apiConfig: { baseUrl: string; apiKey: string }) {
  const topicIdMatch = topicUrl.match(/\/t\/[^/]+\/(\d+)/);
  if (!topicIdMatch) {
    throw new Error('无法从URL中解析出主题ID');
  }
  
  const topicId = topicIdMatch[1];
  const jsonUrl = `${apiConfig.baseUrl}/t/${topicId}.json`;
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(jsonUrl, {
      headers: {
        'Api-Key': apiConfig.apiKey,
        'Api-Username': 'system',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`获取主题信息失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      topicId,
      title: sanitizeInput(data.title || '未知标题'),
      createdAt: data.created_at,
      createdBy: sanitizeInput(data.details?.created_by?.username || 'unknown'),
      postsCount: data.posts_count || 0,
      baseUrl: apiConfig.baseUrl,
    };
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function fetchAllPosts(topicId: string, apiConfig: { baseUrl: string; apiKey: string }) {
  const allPosts: Array<{ post_number: number; username: string; created_at: string }> = [];
  let page = 0;
  const perPage = 30;
  const maxPages = 100;
  
  while (page < maxPages) {
    const postsUrl = `${apiConfig.baseUrl}/t/${topicId}/posts.json?offset=${page * perPage}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(postsUrl, {
        headers: {
          'Api-Key': apiConfig.apiKey,
          'Api-Username': 'system',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
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
            username: sanitizeInput(post.username),
            created_at: post.created_at,
          });
        }
      }
      
      page++;
      
      if (posts.length < perPage) break;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
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
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: '请求过于频繁，请稍后再试' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { topicUrl, configId, lastFloor } = body;
    
    if (!topicUrl || typeof topicUrl !== 'string') {
      return NextResponse.json(
        { error: '缺少帖子链接' },
        { status: 400 }
      );
    }

    const cleanTopicUrl = sanitizeInput(topicUrl);

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
    
    if (!validateTopicUrl(cleanTopicUrl, apiConfig.baseUrl)) {
      return NextResponse.json(
        { error: `帖子域名不匹配，请使用 ${apiConfig.baseUrl} 的帖子` },
        { status: 400 }
      );
    }

    const topicInfo = await fetchTopicInfo(cleanTopicUrl, apiConfig);
    let allPosts = await fetchAllPosts(topicInfo.topicId, apiConfig);

    if (lastFloor && typeof lastFloor === 'number' && lastFloor > 0) {
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
        topicUrl: cleanTopicUrl,
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
        topicUrl: cleanTopicUrl,
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
    
    if (error instanceof Error) {
      if (error.message.includes('aborted')) {
        return NextResponse.json(
          { error: '请求超时，请稍后再试' },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: '抽奖失败，请稍后再试' },
      { status: 500 }
    );
  }
}
