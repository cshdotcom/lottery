'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, Gift, Key, Shield, History } from 'lucide-react';
import Link from 'next/link';

interface AdminSession {
  authenticated: boolean;
}

export function AdminNav() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminSession();
  }, []);

  async function checkAdminSession() {
    try {
      const res = await fetch('/api/auth/admin/check');
      const data = await res.json();
      setIsAdmin(data.authenticated);
    } catch (error) {
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/admin', { method: 'DELETE' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Settings className="mr-2 h-4 w-4" />
        加载中...
      </Button>
    );
  }

  if (!isAdmin) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/login">
          <Settings className="mr-2 h-4 w-4" />
          登录后台
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 bg-purple-600">
            <AvatarImage src="" alt="admin" />
            <AvatarFallback className="bg-purple-600">AD</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">管理员</p>
            <p className="text-xs leading-none text-muted-foreground">
              权限: 全部
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/lottery" className="cursor-pointer">
            <Gift className="mr-2 h-4 w-4" />
            抽奖工具
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/api-configs" className="cursor-pointer">
            <Key className="mr-2 h-4 w-4" />
            API配置
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/level-rules" className="cursor-pointer">
            <Shield className="mr-2 h-4 w-4" />
            等级规则
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/lottery-configs" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            抽奖预设
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/cdks" className="cursor-pointer">
            <Key className="mr-2 h-4 w-4" />
            CDK管理
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/lottery-records" className="cursor-pointer">
            <History className="mr-2 h-4 w-4" />
            抽奖记录
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
