'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  Menu,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const mobileNavItems: NavItem[] = [
  { title: 'navigation.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'navigation.patients', href: '/patients', icon: Users },
  { title: 'navigation.appointments', href: '/appointments', icon: Calendar },
  { title: 'navigation.inbox', href: '/inbox', icon: MessageSquare },
];

const allNavItems: NavItem[] = [
  { title: 'navigation.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'navigation.patients', href: '/patients', icon: Users },
  { title: 'navigation.appointments', href: '/appointments', icon: Calendar },
  { title: 'navigation.inbox', href: '/inbox', icon: MessageSquare },
  { title: 'navigation.crm', href: '/crm', icon: Users },
  { title: 'navigation.finance', href: '/finance', icon: Users },
  { title: 'navigation.inventory', href: '/inventory', icon: Users },
  { title: 'navigation.scheduling', href: '/scheduling', icon: Calendar },
  { title: 'navigation.analytics', href: '/analytics', icon: LayoutDashboard },
  { title: 'navigation.settings', href: '/settings', icon: Menu },
];

export function MobileBottomNav() {
  const t = useTranslations();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Remove locale prefix from pathname for matching
  const pathWithoutLocale = pathname.replace(/^\/(ar|en|ckb|kmr)/, '');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {mobileNavItems.map((item) => {
          const isActive =
            pathWithoutLocale === item.href ||
            pathWithoutLocale.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors',
                'active:bg-muted touch-manipulation',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate max-w-[60px]">{t(item.title)}</span>
            </Link>
          );
        })}

        {/* More Menu */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs',
                'active:bg-muted touch-manipulation text-muted-foreground hover:text-foreground'
              )}
            >
              <Menu className="h-5 w-5" />
              <span>{t('common.more') || 'More'}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
            <ScrollArea className="h-full py-4">
              <div className="grid grid-cols-3 gap-4 px-4">
                {allNavItems.map((item) => {
                  const isActive =
                    pathWithoutLocale === item.href ||
                    pathWithoutLocale.startsWith(`${item.href}/`);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        'flex flex-col items-center justify-center p-4 rounded-lg transition-colors',
                        'active:bg-muted touch-manipulation min-h-[80px]',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted text-muted-foreground'
                      )}
                    >
                      <Icon className="h-6 w-6 mb-2" />
                      <span className="text-xs text-center truncate w-full">
                        {t(item.title)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

// Mobile-friendly pull-to-refresh component
export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [isPulling, setIsPulling] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const startY = React.useRef(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const PULL_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && e.touches[0]) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || !e.touches[0]) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);

    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance * 0.5, PULL_THRESHOLD * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }

    setIsPulling(false);
    setPullDistance(0);
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center transition-transform"
        style={{
          transform: `translateY(${pullDistance - 40}px)`,
          opacity: pullDistance / PULL_THRESHOLD,
        }}
      >
        <div
          className={cn(
            'w-8 h-8 border-2 border-primary rounded-full',
            isRefreshing && 'animate-spin'
          )}
          style={{
            borderTopColor: 'transparent',
            transform: `rotate(${pullDistance * 2}deg)`,
          }}
        />
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Touch-friendly card component for mobile lists
export function MobileCard({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 bg-card rounded-lg border',
        'active:bg-muted transition-colors touch-manipulation',
        'min-h-[44px]', // Minimum touch target size
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
