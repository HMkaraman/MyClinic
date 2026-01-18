'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Camera,
  Save,
} from 'lucide-react';

const mockUser = {
  id: '1',
  name: 'د. سارة أحمد',
  email: 'sara@myclinic.com',
  phone: '+964 750 111 2222',
  role: 'DOCTOR',
  specialty: 'طب أسنان عام',
  avatar: null,
};

export default function ProfileSettingsPage() {
  const t = useTranslations();
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: mockUser.name,
    email: mockUser.email,
    phone: mockUser.phone,
    specialty: mockUser.specialty || '',
  });

  const initials = mockUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Would send to API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('settings.profile')}
          </h1>
          <p className="text-muted-foreground">
            {t('settings.profileDescription')}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('settings.avatar')}</CardTitle>
            <CardDescription>{t('settings.avatarDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={mockUser.avatar || undefined} />
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 end-0 rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 text-center">
              <p className="font-medium">{mockUser.name}</p>
              <p className="text-sm text-muted-foreground">{t(`roles.${mockUser.role.toLowerCase()}`)}</p>
            </div>
            <Button variant="outline" className="mt-4">
              {t('settings.changeAvatar')}
            </Button>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('settings.personalInfo')}</CardTitle>
            <CardDescription>{t('settings.personalInfoDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('common.name')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('common.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('common.phone')}</Label>
                  <Input
                    id="phone"
                    dir="ltr"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                {mockUser.role === 'DOCTOR' && (
                  <div className="space-y-2">
                    <Label htmlFor="specialty">{t('settings.specialty')}</Label>
                    <Input
                      id="specialty"
                      value={formData.specialty}
                      onChange={(e) =>
                        setFormData({ ...formData, specialty: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/settings">{t('common.cancel')}</Link>
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    t('common.saving')
                  ) : (
                    <>
                      <Save className="me-2 h-4 w-4" />
                      {t('common.save')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
