'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Gift, CheckCircle2, AlertCircle, ExternalLink, Send, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface LotteryConfig {
  id: string;
  name: string;
  description?: string;
  winnersCount: number;
  autoPost: boolean;
  apiConfig?: { name: string; baseUrl: string };
}

interface LotteryResult {
  id: string;
  topicTitle: string;
  topicUrl: string;
  author: string;
  winners: Array<{ rank: number; floor: number; username: string }>;
  totalParticipants: number;
  winnersCount: number;
  seed: string;
  config: { name: string; winnersCount: number; autoPost: boolean };
}

export default function LotteryPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<LotteryConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [topicUrl, setTopicUrl] = useState('');
  const [lastFloor, setLastFloor] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [result, setResult] = useState<LotteryResult | null>(null);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    try {
      const response = await fetch('/api/admin/lottery-configs');
      const data = await response.json();
      const validConfigs = data.filter((c: LotteryConfig) => c.apiConfig);
      setConfigs(validConfigs);
      if (validConfigs.length > 0) {
        setSelectedConfig(validConfigs[0].id);
      }
    } catch (error) {
      toast.error('获取抽奖配置失败');
    } finally {
      setIsLoadingConfigs(false);
    }
  }

  async function handleLottery(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedConfig) {
      toast.error('请选择抽奖配置');
      return;
    }
    
    if (!topicUrl.trim()) {
      toast.error('请输入帖子链接');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/lottery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicUrl: topicUrl.trim(),
          configId: selectedConfig,
          lastFloor: lastFloor ? parseInt(lastFloor) : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.record);
        toast.success('抽奖完成！');
      } else {
        toast.error(data.error || '抽奖失败');
      }
    } catch (error) {
      toast.error('抽奖失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePost() {
    if (!result) return;

    setIsPosting(true);

    try {
      const response = await fetch('/api/lottery/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: result.id }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('发帖成功！');
        setResult({ ...result, posted: true } as any);
      } else {
        toast.error(data.error || '发帖失败');
      }
    } catch (error) {
      toast.error('发帖失败');
    } finally {
      setIsPosting(false);
    }
  }

  const selectedConfigData = configs.find(c => c.id === selectedConfig);

  if (isLoadingConfigs) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <CardTitle>暂无可用的抽奖配置</CardTitle>
            <CardDescription>
              请联系管理员在后台配置抽奖参数
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push('/')}>
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Gift className="h-10 w-10" />
            公正抽奖
          </h1>
          <p className="text-muted-foreground mt-2">所有配置由管理员预设，确保公平公正</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              抽奖设置（管理员预设）
            </CardTitle>
            <CardDescription>
              以下配置由管理员预设，用户不可修改
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLottery} className="space-y-4">
              <div className="space-y-2">
                <Label>选择抽奖配置</Label>
                <Select value={selectedConfig} onValueChange={setSelectedConfig}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择配置" />
                  </SelectTrigger>
                  <SelectContent>
                    {configs.map((config) => (
                      <SelectItem key={config.id} value={config.id}>
                        {config.name} - {config.apiConfig?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedConfigData && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">中奖人数:</span>
                    <span className="font-medium">{selectedConfigData.winnersCount} 人</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">关联站点:</span>
                    <span className="font-medium">{selectedConfigData.apiConfig?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">站点域名:</span>
                    <span className="font-medium text-xs">{selectedConfigData.apiConfig?.baseUrl}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">自动发帖:</span>
                    <Badge variant={selectedConfigData.autoPost ? 'default' : 'secondary'}>
                      {selectedConfigData.autoPost ? '是' : '否'}
                    </Badge>
                  </div>
                  {selectedConfigData.description && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">{selectedConfigData.description}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="topicUrl">帖子链接</Label>
                <Input
                  id="topicUrl"
                  value={topicUrl}
                  onChange={(e) => setTopicUrl(e.target.value)}
                  placeholder={`请输入 ${selectedConfigData?.apiConfig?.baseUrl || '站点'} 的帖子链接`}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  帖子域名必须与配置的站点域名一致
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastFloor">最后楼层（可选）</Label>
                <Input
                  id="lastFloor"
                  type="number"
                  min={1}
                  value={lastFloor}
                  onChange={(e) => setLastFloor(e.target.value)}
                  placeholder="限制参与抽奖的最后楼层"
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    抽奖中...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-4 w-4" />
                    开始抽奖
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                抽奖结果
              </CardTitle>
              <CardDescription>{result.topicTitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">帖子作者</p>
                  <p className="text-lg font-semibold">{result.author}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">参与楼层</p>
                  <p className="text-lg font-semibold">{result.totalParticipants}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">中奖人数</p>
                  <p className="text-lg font-semibold">{result.winnersCount}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">使用配置</p>
                  <p className="text-lg font-semibold">{result.config.name}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">最终种子</p>
                <code className="bg-muted px-3 py-2 rounded block text-xs break-all font-mono">
                  {result.seed}
                </code>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">中奖用户</p>
                <div className="space-y-2">
                  {result.winners.map((winner) => (
                    <div key={winner.rank} className="flex items-center justify-between bg-muted p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="default" className="w-8 justify-center">{winner.rank}</Badge>
                        <span className="font-medium">{winner.username}</span>
                      </div>
                      <Badge variant="outline">{winner.floor}楼</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={handlePost}
                  disabled={isPosting || (result as any).posted}
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      发帖中...
                    </>
                  ) : (result as any).posted ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      已发帖
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      发帖公布结果
                    </>
                  )}
                </Button>
                <Button variant="outline" asChild>
                  <a href={result.topicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    查看原帖
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              公平性说明
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Lock className="h-4 w-4 mt-0.5" />
                <span>所有抽奖配置由管理员预设，用户无法修改</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
                <span>帖子域名必须与配置的站点域名一致</span>
              </li>
              <li className="flex items-start gap-2">
                <Gift className="h-4 w-4 mt-0.5" />
                <span>抽奖基于楼层号，不考虑用户等级</span>
              </li>
              <li className="flex items-start gap-2">
                <Send className="h-4 w-4 mt-0.5" />
                <span>发帖使用管理员API，确保结果不可篡改</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
