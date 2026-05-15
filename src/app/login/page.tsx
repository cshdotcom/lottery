'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, LogIn } from 'lucide-react';
import { toast } from 'sonner';

interface ApiConfig {
  id: string;
  name: string;
  baseUrl: string;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [apiConfigId, setApiConfigId] = useState<string>('');
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchApiConfigs();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth');
      if (res.ok) {
        const redirect = searchParams.get('from') || '/';
        router.push(redirect);
      }
    } catch (error) {
    } finally {
      setIsChecking(false);
    }
  }

  async function fetchApiConfigs() {
    try {
      const res = await fetch('/api/admin/api-configs');
      if (res.ok) {
        const data = await res.json();
        setApiConfigs(data.filter((c: ApiConfig) => c.isActive));
        if (data.length > 0) {
          setApiConfigId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch API configs:', error);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('请输入用户名');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), apiConfigId }),
      });

      if (res.ok) {
        toast.success('登录成功！');
        const redirect = searchParams.get('from') || '/';
        router.push(redirect);
      } else {
        const data = await res.json();
        toast.error(data.error || '登录失败，请检查用户名');
      }
    } catch (error) {
      toast.error('登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <User className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">登录抽奖系统</CardTitle>
          <CardDescription>
            使用 Discourse 论坛用户名登录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {apiConfigs.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="apiConfig">选择站点</Label>
                <Select value={apiConfigId} onValueChange={setApiConfigId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择站点" />
                  </SelectTrigger>
                  <SelectContent>
                    {apiConfigs.map((config) => (
                      <SelectItem key={config.id} value={config.id}>
                        {config.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Discourse 用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="输入您的论坛用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  登录
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-sm text-muted-foreground text-center">
            <p>登录后可使用抽奖和管理功能</p>
            <p className="mt-1">登录状态保持 7 天</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
