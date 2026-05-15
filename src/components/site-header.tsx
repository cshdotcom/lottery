'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UserNav } from '@/components/user-nav';
import { Gift, Settings, Shield, History, Home } from 'lucide-react';

const navItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/lottery', label: '抽奖工具', icon: Gift },
  { href: '/admin/api-configs', label: 'API配置', icon: Settings },
  { href: '/admin/level-rules', label: '等级规则', icon: Shield },
  { href: '/admin/lottery-configs', label: '抽奖预设', icon: Settings },
  { href: '/admin/lottery-records', label: '抽奖记录', icon: History },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Gift className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block">
            LINUX DO 抽奖系统
          </span>
        </Link>

        <nav className="flex items-center space-x-6 ml-6 text-sm font-medium md:flex">
          {navItems.slice(0, 2).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'transition-colors hover:text-foreground/80 flex items-center gap-1.5',
                  isActive ? 'text-foreground' : 'text-foreground/60'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
