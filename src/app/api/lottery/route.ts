import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

interface TopicInfo {
  topicId: string;
  title: string;
  createdAt: string;
  createdBy: string;
  baseUrl: string;
  validPostNumbers: number[];
  validPostIds: string[];
  validPostCreated: string[];
}

async function fetchTopicInfo(topicUrl: string, cookies: string) {
  const topicIdMatch = topicUrl.match(/\/t\/topic\/(\d+)/);
  if (!topicIdMatch) {
    throw new Error('无法从URL中解析出主题ID');
  }
  
  const topicId = topicIdMatch[1];
  const baseUrl = process.env.DISCOURSE_BASE_URL || 'https://linux.do';
  const jsonUrl = `${baseUrl}/t/${topicId}.json`;
  
  const response = await fetch(jsonUrl, {
    headers: {
      'Cookie': cookies,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`获取主题信息失败: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.closed && !data.archived) {
    throw new Error('帖子尚未关闭或存档，不能进行抽奖');
  }
  
  return {
    topicId,
    title: data.title,
    createdAt: data.created_at,
    createdBy: data.details?.created_by?.username || 'unknown',
    baseUrl,
  };
}

async function fetchValidPostNumbers(topicId: string, cookies: string, lastFloor?: number) {
  const baseUrl = process.env.DISCOURSE_BASE_URL || 'https://linux.do';
  const connectUrl = baseUrl.includes('linux.do') ? 'https://connect.linux.do' : baseUrl;
  const validPostsUrl = `${connectUrl}/api/topic/${topicId}/valid_post_number`;
  
  const response = await fetch(validPostsUrl, {
    headers: {
      'Cookie': cookies,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`获取有效楼层失败: ${response.status}`);
  }
  
  const data = await response.json();
  
  let validPostNumbers = data.rows || [];
  let validPostIds = data.ids || [];
  let validPostCreated = data.created || [];
  
  if (lastFloor !== undefined && lastFloor > 0) {
    const cutIndex = validPostNumbers.findIndex((floor: number) => floor > lastFloor);
    if (cutIndex !== -1) {
      validPostNumbers = validPostNumbers.slice(0, cutIndex);
      validPostIds = validPostIds.slice(0, cutIndex);
      validPostCreated = validPostCreated.slice(0, cutIndex);
    }
  }
  
  if (validPostNumbers.length === 0) {
    throw new Error('没有有效的参与楼层');
  }
  
  return { validPostNumbers, validPostIds, validPostCreated };
}

function generateSeed(topicInfo: TopicInfo, winnersCount: number): string {
  const seedContent = [
    winnersCount.toString(),
    topicInfo.topicId,
    topicInfo.createdBy,
    topicInfo.createdAt,
    topicInfo.validPostIds.join(','),
    topicInfo.validPostNumbers.join(','),
    topicInfo.validPostCreated.join(','),
  ].join('|');
  
  const md5Hash = crypto.createHash('md5').update(seedContent).digest('hex');
  const sha1Hash = crypto.createHash('sha1').update(seedContent).digest('hex');
  const sha512Hash = crypto.createHash('sha512').update(seedContent).digest('hex');
  
  return crypto
    .createHash('sha256')
    .update(md5Hash + sha1Hash + sha512Hash)
    .digest('hex');
}

function generateWinners(seed: string, validFloors: number[], winnersCount: number): number[] {
  const seedNum = parseInt(seed.substring(0, 8), 16);
  const winners: number[] = [];
  let availableFloors = [...validFloors];
  
  let state = seedNum;
  for (let i = 0; i < winnersCount && availableFloors.length > 0; i++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const index = state % availableFloors.length;
    winners.push(availableFloors[index]);
    availableFloors.splice(index, 1);
  }
  
  return winners;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicUrl, winnersCount, lastFloor, apiConfigId, cookies } = body;
    
    if (!topicUrl || !winnersCount) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }
    
    const cookieString = cookies || '';
    
    const topicInfo = await fetchTopicInfo(topicUrl, cookieString);
    const { validPostNumbers, validPostIds, validPostCreated } = await fetchValidPostNumbers(
      topicInfo.topicId,
      cookieString,
      lastFloor
    );
    
    topicInfo.validPostNumbers = validPostNumbers;
    topicInfo.validPostIds = validPostIds;
    topicInfo.validPostCreated = validPostCreated;
    
    const winners = generateWinners(
      generateSeed(topicInfo, winnersCount),
      validPostNumbers,
      winnersCount
    );
    
    const winnersText = winners.map((floor, i) => `[${i + 1}] ${floor}楼`).join('\n');
    
    const record = await prisma.lotteryRecord.create({
      data: {
        topicId: topicInfo.topicId,
        topicUrl: topicUrl,
        topicTitle: topicInfo.title,
        author: topicInfo.createdBy,
        winnersCount: winnersCount,
        winners: winners.join(','),
        seed: generateSeed(topicInfo, winnersCount),
        totalParticipants: validPostNumbers.length,
        apiConfigId: apiConfigId || null,
        posted: false,
      },
      include: { apiConfig: true },
    });
    
    const result = {
      success: true,
      topicUrl: topicUrl,
      topicTitle: topicInfo.title,
      author: topicInfo.createdBy,
      winners,
      totalParticipants: validPostNumbers.length,
      seed: record.seed,
      recordId: record.id,
      baseUrl: topicInfo.baseUrl,
      topicId: topicInfo.topicId,
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('抽奖失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '抽奖失败' },
      { status: 500 }
    );
  }
}
