'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Key, Settings, Shield } from 'lucide-react';
import Link from 'next/link';

interface AdminSession {
  authenticated: boolean;
}

export function CdkNav() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
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
        加载中...
      </Button>
    );
  }

  if (!isAdmin) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/login">
          登录
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 bg-purple-600">
            <AvatarFallback className="bg-purple-600 text-white">AD</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">管理员</p>
            <p className="text-xs leading-none text-muted-foreground">
              CDK管理权限
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/cdk/create" className="cursor-pointer">
            <Key className="mr-2 h-4 w-4" />
            创建CDK
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/cdk" className="cursor-pointer">
            <Key className="mr-2 h-4 w-4" />
            验证CDK
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/lottery" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            抽奖工具
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/cdks" className="cursor-pointer">
            <Shield className="mr-2 h-4 w-4" />
            CDK后台管理
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
