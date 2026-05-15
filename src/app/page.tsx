import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminNav } from '@/components/admin-nav';
import { CdkNav } from '@/components/cdk-nav';
import { Gift, Settings, Shield, History, Key, ChevronRight, Plus } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Gift className="h-6 w-6 text-primary" />
            <span className="font-bold">抽奖系统</span>
          </Link>
          <div className="flex items-center gap-4">
            <CdkNav />
            <AdminNav />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            抽奖管理系统
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            公正透明的论坛抽奖工具，支持CDK兑换码管理
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Gift className="h-6 w-6 text-primary" />
                抽奖工具
              </CardTitle>
              <CardDescription>为帖子进行公正抽奖</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                输入帖子链接，系统自动抽取中奖楼层
              </p>
              <Button asChild className="w-full">
                <Link href="/lottery">
                  开始抽奖
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Plus className="h-6 w-6 text-green-600" />
                创建 CDK
              </CardTitle>
              <CardDescription>登录后创建兑换码</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                登录后可以创建CDK兑换码，支持批量生成
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link href="/cdk/create">
                  <Key className="mr-2 h-4 w-4" />
                  创建CDK
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Key className="h-6 w-6 text-blue-600" />
                验证 CDK
              </CardTitle>
              <CardDescription>检查兑换码有效性</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                输入CDK验证是否有效，查看剩余次数
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link href="/cdk">
                  验证CDK
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Settings className="h-6 w-6 text-purple-600" />
                后台管理
              </CardTitle>
              <CardDescription>管理配置和CDK</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                配置API、创建抽奖预设、管理CDK
              </p>
              <div className="space-y-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/login">
                    <Shield className="mr-2 h-4 w-4" />
                    登录后台
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <History className="h-6 w-6 text-orange-600" />
                抽奖记录
              </CardTitle>
              <CardDescription>查看历史抽奖</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                查看所有抽奖记录和发帖状态
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/lottery-records">
                  查看记录
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6" />
                系统特点
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">🎯 公正抽奖</h3>
                  <p className="text-sm text-muted-foreground">
                    多重哈希算法确保每次抽奖结果唯一可验证
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">🔑 CDK管理</h3>
                  <p className="text-sm text-muted-foreground">
                    登录用户可创建兑换码，支持批量生成
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">🚀 自动发帖</h3>
                  <p className="text-sm text-muted-foreground">
                    在原帖下自动回复公布抽奖结果
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>抽奖管理系统 v1.0.0</p>
          <p className="mt-1">基于 Next.js + Docker 构建</p>
        </footer>
      </div>
    </div>
  );
}
