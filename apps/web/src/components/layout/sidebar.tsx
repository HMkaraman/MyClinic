'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  Receipt,
  MessageSquare,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  Bot,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { title: 'navigation.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'navigation.patients', href: '/patients', icon: Users },
  { title: 'navigation.appointments', href: '/appointments', icon: Calendar },
  { title: 'navigation.visits', href: '/visits', icon: Stethoscope, roles: ['ADMIN', 'MANAGER', 'DOCTOR', 'NURSE'] },
  { title: 'navigation.finance', href: '/finance', icon: Receipt, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { title: 'navigation.inbox', href: '/inbox', icon: MessageSquare },
  { title: 'navigation.crm', href: '/crm', icon: Target, roles: ['ADMIN', 'MANAGER', 'SUPPORT', 'RECEPTION'] },
  { title: 'navigation.ai', href: '/ai', icon: Bot, roles: ['ADMIN', 'MANAGER', 'SUPPORT'] },
  { title: 'navigation.settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed = false, onCollapse }: SidebarProps) {
  const t = useTranslations();
  const pathname = usePathname();

  // Remove locale prefix from pathname for matching
  const pathWithoutLocale = pathname.replace(/^\/(ar|en|ckb|kmr)/, '');

  return (
    <aside
      className={cn(
        'flex flex-col border-e bg-card transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="h-6 w-6" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-lg">MyClinic</span>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathWithoutLocale === item.href ||
                            pathWithoutLocale.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <span className="truncate">{t(item.title)}</span>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Collapse toggle */}
      <Separator />
      <div className="p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => onCollapse?.(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          ) : (
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          )}
        </Button>
      </div>
    </aside>
  );
}
