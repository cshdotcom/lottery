'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Shield, CheckCircle2, XCircle, Calendar, MessageSquare, Key, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  username: string;
  trustLevel: number;
  avatarUrl?: string;
  bio?: string;
  joinedAt?: string;
  postCount: number;
  cached: boolean;
}

interface CdkValidation {
  valid: boolean;
  name?: string;
  description?: string;
  remainingUses?: number;
}

export default function UserProfilePage() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [levelRules, setLevelRules] = useState<any[]>([]);
  const [matchedRules, setMatchedRules] = useState<any[]>([]);

  useEffect(() => {
    fetchLevelRules();
  }, []);

  async function fetchLevelRules() {
    try {
      const res = await fetch('/api/admin/level-rules');
      const data = await res.json();
      setLevelRules(data.filter((r: any) => r.isActive));
    } catch (error) {
      console.error('Failed to fetch level rules:', error);
    }
  }

  async function lookupUser() {
    if (!username.trim()) {
      toast.error('请输入用户名');
      return;
    }

    setIsLoading(true);
    setProfile(null);
    setMatchedRules([]);

    try {
      const response = await fetch(`/api/user/profile?username=${encodeURIComponent(username.trim())}`);
      const data = await response.json();

      if (response.ok) {
        setProfile(data);
        checkMatchedRules(data);
        toast.success('用户资料获取成功');
      } else {
        toast.error(data.error || '获取用户资料失败');
      }
    } catch (error) {
      toast.error('查询失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }

  function checkMatchedRules(userProfile: UserProfile) {
    const matched = levelRules.filter(rule => {
      if (rule.minLevel > userProfile.trustLevel) return false;
      if (rule.requireAvatar && !userProfile.avatarUrl) return false;
      if (rule.requireBio && !userProfile.bio) return false;
      if (rule.requirePostCount > userProfile.postCount) return false;
      if (rule.requireJoinedDays > 0 && userProfile.joinedAt) {
        const joinedDate = new Date(userProfile.joinedAt);
        const daysSinceJoined = Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceJoined < rule.requireJoinedDays) return false;
      }
      return true;
    });

    setMatchedRules(matched);
  }

  function getTrustLevelBadge(level: number) {
    const badges = [
      { level: 0, name: 'New', color: 'bg-gray-500', text: '新用户' },
      { level: 1, name: 'Basic', color: 'bg-blue-500', text: '基础用户' },
      { level: 2, name: 'Member', color: 'bg-green-500', text: '正式会员' },
      { level: 3, name: 'Regular', color: 'bg-purple-500', text: '活跃会员' },
      { level: 4, name: 'Leader', color: 'bg-orange-500', text: '社区领袖' },
    ];

    const badge = badges.find(b => b.level === level) || badges[0];
    return (
      <Badge className={`${badge.color} text-white`}>
        TL{level} - {badge.text}
      </Badge>
    );
  }

  function getRequirementIcon(passed: boolean) {
    return passed ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8" />
            用户资料查询
          </h1>
          <p className="text-muted-foreground mt-1">通过API获取Discourse用户资料和等级信息</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>查询用户</CardTitle>
            <CardDescription>输入用户名查询其在论坛的资料信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入用户名"
                onKeyDown={(e) => e.key === 'Enter' && lookupUser()}
              />
              <Button onClick={lookupUser} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    查询
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {profile && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  用户资料
                  {profile.cached && (
                    <Badge variant="outline" className="ml-auto">缓存数据</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatarUrl || ''} alt={profile.username} />
                    <AvatarFallback className="text-2xl">{profile.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold">{profile.username}</h3>
                      {getTrustLevelBadge(profile.trustLevel)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span>发帖数:</span>
                        <span className="font-medium">{profile.postCount}</span>
                      </div>
                      {profile.joinedAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>注册于:</span>
                          <span className="font-medium">{new Date(profile.joinedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {profile.bio && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground mb-1">个人简介:</p>
                        <p className="text-sm bg-muted p-3 rounded-md">{profile.bio}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        {profile.avatarUrl ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>已设置头像</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span>未设置头像</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  等级规则匹配
                </CardTitle>
                <CardDescription>
                  当前用户符合 {matchedRules.length} / {levelRules.length} 条规则
                </CardDescription>
              </CardHeader>
              <CardContent>
                {levelRules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>暂无等级规则配置</p>
                    <p className="text-sm">请在后台管理中添加等级规则</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {levelRules.map(rule => {
                      const matched = matchedRules.includes(rule);
                      return (
                        <div key={rule.id} className={`p-4 rounded-lg border ${matched ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getRequirementIcon(matched)}
                              <span className="font-medium">{rule.name}</span>
                            </div>
                            <Badge variant={matched ? 'default' : 'secondary'}>
                              {matched ? '符合' : '不符合'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              <span>最低等级: TL{rule.minLevel}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getRequirementIcon(!rule.requireAvatar || !!profile.avatarUrl)}
                              <span>头像</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getRequirementIcon(!rule.requireBio || !!profile.bio)}
                              <span>简介</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getRequirementIcon(!rule.requirePostCount || profile.postCount >= rule.requirePostCount)}
                              <span>发帖≥{rule.requirePostCount || 0}</span>
                            </div>
                          </div>

                          {rule.description && (
                            <p className="text-xs text-muted-foreground mt-2">{rule.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
