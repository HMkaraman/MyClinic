'use client';

import * as React from 'react';
import { useServiceWorker, useOffline } from '@/hooks/use-offline';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { RefreshCw, X, WifiOff, Bell } from 'lucide-react';

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const t = useTranslations();
  const { updateAvailable, update } = useServiceWorker();
  const { isOffline, wasOffline } = useOffline({
    onOnline: () => {
      console.log('Back online - syncing data...');
    },
    onOffline: () => {
      console.log('Gone offline - switching to cached data...');
    },
  });

  const [showUpdateBanner, setShowUpdateBanner] = React.useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = React.useState(false);
  const [showReconnectedBanner, setShowReconnectedBanner] = React.useState(false);

  // Show update banner when update is available
  React.useEffect(() => {
    if (updateAvailable) {
      setShowUpdateBanner(true);
    }
  }, [updateAvailable]);

  // Show offline/reconnected banners
  React.useEffect(() => {
    if (isOffline) {
      setShowOfflineBanner(true);
      setShowReconnectedBanner(false);
    } else if (wasOffline && !isOffline) {
      setShowOfflineBanner(false);
      setShowReconnectedBanner(true);
      // Auto-hide reconnected banner after 3 seconds
      const timer = setTimeout(() => setShowReconnectedBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOffline, wasOffline]);

  return (
    <>
      {children}

      {/* Update Available Banner */}
      {showUpdateBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-primary text-primary-foreground rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom">
          <div className="flex items-start gap-3">
            <RefreshCw className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium">
                {t('pwa.updateAvailable') || 'Update Available'}
              </h4>
              <p className="text-sm opacity-90">
                {t('pwa.updateMessage') || 'A new version of MyClinic is available.'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                update();
                setShowUpdateBanner(false);
              }}
            >
              {t('pwa.update') || 'Update'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowUpdateBanner(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Offline Banner */}
      {showOfflineBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-warning text-warning-foreground rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom">
          <div className="flex items-center gap-3">
            <WifiOff className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium">
                {t('pwa.offline') || "You're Offline"}
              </h4>
              <p className="text-sm opacity-90">
                {t('pwa.offlineMessage') || 'Some features may be unavailable.'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowOfflineBanner(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Reconnected Banner */}
      {showReconnectedBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-success text-success-foreground rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium">
                {t('pwa.backOnline') || 'Back Online'}
              </h4>
              <p className="text-sm opacity-90">
                {t('pwa.syncingData') || 'Syncing your data...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Install prompt component for mobile
export function InstallPrompt() {
  const t = useTranslations();
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);

  React.useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not dismissed recently
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed || Date.now() - parseInt(dismissed) > 7 * 24 * 60 * 60 * 1000) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card border rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Bell className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium">
            {t('pwa.installTitle') || 'Install MyClinic'}
          </h4>
          <p className="text-sm text-muted-foreground">
            {t('pwa.installMessage') || 'Add to your home screen for quick access.'}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" className="flex-1" onClick={handleDismiss}>
          {t('pwa.notNow') || 'Not Now'}
        </Button>
        <Button className="flex-1" onClick={handleInstall}>
          {t('pwa.install') || 'Install'}
        </Button>
      </div>
    </div>
  );
}
