'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Plus,
  Send,
  Phone,
  MoreVertical,
  User,
  Circle,
  CheckCircle2,
  Clock,
  Paperclip,
} from 'lucide-react';

interface Conversation {
  id: string;
  patientName: string;
  patientPhone: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'resolved' | 'waiting';
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: 'staff' | 'patient';
  senderName: string;
  status: 'sent' | 'delivered' | 'read';
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    patientName: 'أحمد محمد علي',
    patientPhone: '+964 750 123 4567',
    lastMessage: 'شكراً دكتور، سأحضر في الموعد المحدد',
    lastMessageTime: '10:30',
    unreadCount: 0,
    status: 'resolved',
  },
  {
    id: '2',
    patientName: 'فاطمة حسين',
    patientPhone: '+964 750 234 5678',
    lastMessage: 'هل يمكنني تغيير موعدي إلى يوم الخميس؟',
    lastMessageTime: '09:45',
    unreadCount: 2,
    status: 'waiting',
  },
  {
    id: '3',
    patientName: 'محمود سعيد',
    patientPhone: '+964 750 345 6789',
    lastMessage: 'لدي استفسار عن الدواء الموصوف',
    lastMessageTime: 'أمس',
    unreadCount: 1,
    status: 'active',
  },
  {
    id: '4',
    patientName: 'نور الهدى',
    patientPhone: '+964 750 456 7890',
    lastMessage: 'تم تأكيد الموعد، شكراً لكم',
    lastMessageTime: 'أمس',
    unreadCount: 0,
    status: 'resolved',
  },
];

const mockMessages: Message[] = [
  {
    id: '1',
    content: 'مرحباً، هل يمكنني تغيير موعدي إلى يوم الخميس؟',
    timestamp: '09:30',
    sender: 'patient',
    senderName: 'فاطمة حسين',
    status: 'read',
  },
  {
    id: '2',
    content: 'مرحباً فاطمة، نعم يمكنك ذلك. هل تفضلين موعد الصباح أم المساء؟',
    timestamp: '09:35',
    sender: 'staff',
    senderName: 'الاستقبال',
    status: 'read',
  },
  {
    id: '3',
    content: 'أفضل موعد الصباح إن أمكن',
    timestamp: '09:40',
    sender: 'patient',
    senderName: 'فاطمة حسين',
    status: 'read',
  },
  {
    id: '4',
    content: 'ممتاز، لدينا موعد متاح الساعة 10 صباحاً يوم الخميس. هل يناسبك؟',
    timestamp: '09:45',
    sender: 'staff',
    senderName: 'الاستقبال',
    status: 'delivered',
  },
];

export default function InboxPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedConversation, setSelectedConversation] = React.useState<string | null>('2');
  const [newMessage, setNewMessage] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const filteredConversations = mockConversations.filter((conv) => {
    const matchesSearch =
      conv.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.patientPhone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedConv = mockConversations.find((c) => c.id === selectedConversation);
  const totalUnread = mockConversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    // Would send message to API
    setNewMessage('');
  };

  const getStatusIcon = (status: Conversation['status']) => {
    switch (status) {
      case 'active':
        return <Circle className="h-3 w-3 fill-green-500 text-green-500" />;
      case 'waiting':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle2 className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getMessageStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sent':
        return <Circle className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCircle2 className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('inbox.title')}
          </h1>
          <p className="text-muted-foreground">
            {totalUnread > 0
              ? `${totalUnread} ${t('inbox.unreadMessages')}`
              : t('inbox.noUnread')}
          </p>
        </div>
        <Button>
          <Plus className="me-2 h-4 w-4" />
          {t('inbox.newMessage')}
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3 h-[calc(100vh-220px)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-3">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('inbox.searchConversations')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  {t('inbox.all')}
                </Button>
                <Button
                  variant={statusFilter === 'waiting' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter('waiting')}
                >
                  {t('inbox.waiting')}
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                >
                  {t('inbox.active')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-2">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation === conv.id
                        ? 'bg-muted'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedConversation(conv.id)}
                  >
                    <Avatar>
                      <AvatarFallback>
                        {conv.patientName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{conv.patientName}</p>
                        <span className="text-xs text-muted-foreground">
                          {conv.lastMessageTime}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(conv.status)}
                        <span className="text-xs text-muted-foreground">
                          {t(`inbox.${conv.status}`)}
                        </span>
                      </div>
                    </div>
                    {conv.unreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {selectedConv.patientName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedConv.patientName}</p>
                      <p className="text-sm text-muted-foreground" dir="ltr">
                        {selectedConv.patientPhone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <User className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-450px)]">
                  <div className="space-y-4 p-4">
                    {mockMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender === 'staff' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender === 'staff'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div
                            className={`flex items-center gap-1 mt-1 ${
                              message.sender === 'staff' ? 'justify-end' : ''
                            }`}
                          >
                            <span
                              className={`text-xs ${
                                message.sender === 'staff'
                                  ? 'text-primary-foreground/70'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {message.timestamp}
                            </span>
                            {message.sender === 'staff' && (
                              <span className="text-primary-foreground/70">
                                {getMessageStatusIcon(message.status)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Textarea
                    placeholder={t('inbox.typeMessage')}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[40px] max-h-[120px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button size="icon" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4" />
                <p>{t('inbox.selectConversation')}</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
