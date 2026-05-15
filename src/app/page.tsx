import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Settings, Shield, History, ChevronRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            LINUX DO 抽奖管理系统
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            公正透明的论坛抽奖工具，支持自动识别等级要求，自动发布抽奖结果
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Gift className="h-8 w-8 text-primary" />
                抽奖工具
              </CardTitle>
              <CardDescription>为帖子进行公正抽奖</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                输入帖子链接，设置中奖人数，即可快速进行抽奖。支持自定义最后楼层范围。
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>自动识别有效参与楼层</li>
                <li>多重哈希算法确保公正</li>
                <li>一键复制抽奖结果</li>
                <li>自动发帖公布结果</li>
              </ul>
              <Button asChild className="w-full" size="lg">
                <Link href="/lottery">
                  开始抽奖
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Settings className="h-8 w-8 text-primary" />
                后台管理
              </CardTitle>
              <CardDescription>管理API配置和规则</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                配置Discourse API连接，管理用户等级规则，设置自动发帖参数。
              </p>
              <div className="space-y-2">
                <Link href="/admin/api-configs" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Gift className="mr-2 h-4 w-4" />
                    API 配置管理
                  </Button>
                </Link>
                <Link href="/admin/level-rules" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="mr-2 h-4 w-4" />
                    等级规则管理
                  </Button>
                </Link>
                <Link href="/admin/lottery-configs" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    抽奖预设配置
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-6 w-6" />
                功能特点
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">🎯 精准识别</h3>
                  <p className="text-sm text-muted-foreground">
                    自动识别符合抽奖条件的楼层，支持等级要求配置，过滤无效用户。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">🔐 公正透明</h3>
                  <p className="text-sm text-muted-foreground">
                    使用多重哈希算法生成种子，结合帖子信息确保每次抽奖结果唯一可验证。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">🚀 自动发帖</h3>
                  <p className="text-sm text-muted-foreground">
                    配置Discourse API后，可自动在论坛发帖公布抽奖结果，无需手动复制粘贴。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>LINUX DO 抽奖管理系统 v1.0.0</p>
          <p className="mt-1">基于 Next.js + Docker 构建</p>
        </footer>
      </div>
    </div>
  );
}
