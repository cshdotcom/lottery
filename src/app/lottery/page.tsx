'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Gift, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LotteryResult {
  success: boolean;
  topicUrl?: string;
  topicTitle?: string;
  author?: string;
  winners?: number[];
  totalParticipants?: number;
  seed?: string;
  recordId?: string;
  baseUrl?: string;
  topicId?: string;
  error?: string;
}

export default function LotteryPage() {
  const [topicUrl, setTopicUrl] = useState('');
  const [winnersCount, setWinnersCount] = useState(1);
  const [lastFloor, setLastFloor] = useState<number | undefined>(undefined);
  const [cookies, setCookies] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LotteryResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/lottery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicUrl,
          winnersCount,
          lastFloor: lastFloor || undefined,
          cookies: cookies || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '抽奖失败');
      }

      setResult(data);
      toast.success('抽奖完成');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '抽奖失败');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    
    const content = `🎉 LINUX DO 抽奖结果

帖子链接: ${result.topicUrl}
帖子标题: ${result.topicTitle}
帖子作者: ${result.author}

参与楼层: ${result.totalParticipants} 楼
中奖数量: ${winnersCount} 个
最终种子: ${result.seed}

恭喜以下楼层中奖:
${result.winners?.map((floor, i) => `[${i + 1}] ${floor}楼`).join('\n') || ''}
`;

    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  const generatePostContent = () => {
    if (!result) return '';
    
    return `🎉 抽奖结果公布

恭喜以下 ${winnersCount} 位幸运用户！

${result.winners?.map((floor, i) => `**${i + 1}. ${floor}楼**`).join('\n') || ''}

---

抽奖信息：
- 帖子链接: ${result.topicUrl}
- 参与楼层: ${result.totalParticipants} 楼
- 最终种子: \`${result.seed}\`

恭喜所有中奖用户！🎊`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary flex items-center justify-center gap-3">
            <Gift className="h-10 w-10" />
            LINUX DO 抽奖工具
          </h1>
          <p className="text-muted-foreground">自动识别有效楼层，公正透明抽奖</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>抽奖设置</CardTitle>
            <CardDescription>输入帖子信息开始抽奖</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topicUrl">帖子 URL</Label>
                <Input
                  id="topicUrl"
                  placeholder="https://linux.do/t/topic/12345"
                  value={topicUrl}
                  onChange={(e) => setTopicUrl(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="winnersCount">中奖人数</Label>
                  <Input
                    id="winnersCount"
                    type="number"
                    min={1}
                    value={winnersCount}
                    onChange={(e) => setWinnersCount(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastFloor">最后楼层（可选）</Label>
                  <Input
                    id="lastFloor"
                    type="number"
                    min={1}
                    placeholder="限制参与抽奖的最后楼层"
                    value={lastFloor || ''}
                    onChange={(e) => setLastFloor(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cookies">Cookies（可选，用于需要登录的API）</Label>
                <Input
                  id="cookies"
                  type="password"
                  placeholder="输入认证cookies"
                  value={cookies}
                  onChange={(e) => setCookies(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  抽奖结果
                </CardTitle>
                <CardDescription>{result.topicTitle}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    复制结果
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">帖子ID</p>
                  <p className="text-lg font-semibold">{result.topicId}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">参与楼层</p>
                  <p className="text-lg font-semibold">{result.totalParticipants}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">中奖数量</p>
                  <p className="text-lg font-semibold">{winnersCount}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">帖子作者</p>
                  <p className="text-lg font-semibold">{result.author}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">最终种子</p>
                <code className="bg-muted px-3 py-2 rounded block text-xs break-all">
                  {result.seed}
                </code>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">中奖楼层</p>
                <div className="flex flex-wrap gap-2">
                  {result.winners?.map((floor, i) => (
                    <Badge key={i} variant="default" className="text-lg px-4 py-1">
                      {floor}楼
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">发帖内容预览</p>
                <Textarea
                  value={generatePostContent()}
                  readOnly
                  className="h-48 font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    fetch('/api/lottery/post', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        recordId: result.recordId,
                        content: generatePostContent(),
                      }),
                    })
                      .then((res) => res.json())
                      .then((data) => {
                        if (data.success) {
                          toast.success('发帖成功');
                        } else {
                          toast.error(data.error || '发帖失败');
                        }
                      })
                      .catch(() => toast.error('发帖失败'));
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  自动发帖到论坛
                </Button>
                <Button variant="outline" asChild>
                  <a href={result.topicUrl} target="_blank" rel="noopener noreferrer">
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
              注意事项
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>帖子必须先关闭或存档才能进行抽奖</li>
              <li>有效楼层由 connect.linux.do 服务自动识别</li>
              <li>Cookies 仅在需要登录访问时填写</li>
              <li>抽奖结果使用多重哈希算法确保公正</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
