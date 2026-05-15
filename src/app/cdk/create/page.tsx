'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Key, CheckCircle2, Copy, RefreshCw, User } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface User {
  username: string;
  trustLevel: number;
}

export default function CreateCdkPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    count: 1,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createdCodes, setCreatedCodes] = useState<string[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const res = await fetch('/api/auth');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Check user failed:', error);
    } finally {
      setIsLoadingUser(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('请输入CDK名称');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/cdk/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          count: formData.count,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCreatedCodes(data.codes);
        toast.success(`成功创建 ${data.count} 个CDK`);
      } else {
        toast.error(data.error || '创建失败');
      }
    } catch (error) {
      toast.error('创建失败，请重试');
    } finally {
      setIsCreating(false);
    }
  }

  function copyAllCodes() {
    navigator.clipboard.writeText(createdCodes.join('\n'));
    toast.success('已复制到剪贴板');
  }

  function copySingleCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success('已复制');
  }

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>需要登录</CardTitle>
            <CardDescription>
              请先使用论坛账号登录才能创建CDK
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/login?from=/cdk/create">
                登录论坛账号
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/login">
                后台登录
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Key className="h-8 w-8" />
            创建 CDK
          </h1>
          <p className="text-muted-foreground mt-2">创建兑换码供他人使用</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant="outline">
              <User className="mr-1 h-3 w-3" />
              {user.username} (TL{user.trustLevel})
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>创建 CDK</CardTitle>
            <CardDescription>创建您专属的兑换码</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">CDK 名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：幸运抽奖码"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">描述（可选）</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="这个CDK的用途说明..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="count">生成数量</Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={100}
                  value={formData.count}
                  onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 1 })}
                />
                <p className="text-xs text-muted-foreground">每个CDK只能使用一次</p>
              </div>

              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    创建 {formData.count} 个 CDK
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {createdCodes.length > 0 && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                创建成功！
              </CardTitle>
              <CardDescription>
                已创建 {createdCodes.length} 个CDK，请妥善保管
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>CDK 列表</Label>
                  <Button variant="outline" size="sm" onClick={() => setCreatedCodes([])}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    清空
                  </Button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {createdCodes.map((code, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-3 rounded-lg">
                      <span className="font-mono text-sm font-medium">{code}</span>
                      <Button variant="ghost" size="icon" onClick={() => copySingleCode(code)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={copyAllCodes} className="w-full">
                <Copy className="mr-2 h-4 w-4" />
                复制全部 CDK
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>CDK 使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Badge variant="outline">1</Badge>
              <span>创建CDK后，系统会生成唯一的兑换码</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline">2</Badge>
              <span>复制CDK分享给需要的人</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline">3</Badge>
              <span>获得者可以在CDK验证页面输入兑换</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline">4</Badge>
              <span>每个CDK只能使用一次，用完即失效</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
