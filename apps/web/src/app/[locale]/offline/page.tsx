'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RefreshCw, Home } from 'lucide-react';

export default function OfflinePage() {
  const t = useTranslations();
  const [isOnline, setIsOnline] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  React.useEffect(() => {
    if (isOnline) {
      // Redirect back when online
      const redirect = sessionStorage.getItem('offlineRedirect') || '/dashboard';
      sessionStorage.removeItem('offlineRedirect');
      window.location.href = redirect;
    }
  }, [isOnline]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto rounded-full bg-muted p-4 mb-4">
            <WifiOff className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">
            {t('offline.title') || "You're Offline"}
          </CardTitle>
          <CardDescription>
            {t('offline.description') ||
              "It looks like you've lost your internet connection. Some features may be unavailable."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('offline.hint') ||
                "Don't worry, your data is safe. The app will automatically reconnect when your connection is restored."}
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">
                {t('offline.availableOffline') || 'Available Offline:'}
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {t('offline.viewCachedData') || 'View cached appointments'}</li>
                <li>• {t('offline.viewCachedPatients') || 'View cached patient records'}</li>
                <li>• {t('offline.queueActions') || 'Queue actions for sync'}</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="me-2 h-4 w-4" />
            {t('offline.tryAgain') || 'Try Again'}
          </Button>
          <Button onClick={() => (window.location.href = '/dashboard')}>
            <Home className="me-2 h-4 w-4" />
            {t('offline.goHome') || 'Go to Dashboard'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
