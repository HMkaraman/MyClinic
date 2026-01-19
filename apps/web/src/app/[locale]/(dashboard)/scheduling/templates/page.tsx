'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  FileText,
  Clock,
} from 'lucide-react';

type DayOfWeek = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

interface TemplateSlot {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

interface ScheduleTemplate {
  id: string;
  name: string;
  description?: string;
  slots: TemplateSlot[];
  createdAt: string;
}

const DAYS_OF_WEEK: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const dayLabels: Record<DayOfWeek, string> = {
  SUNDAY: 'Sun',
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
};

// Mock data
const mockTemplates: ScheduleTemplate[] = [
  {
    id: '1',
    name: 'Standard Week',
    description: 'Monday to Friday, 9 AM to 5 PM',
    slots: [
      { dayOfWeek: 'SUNDAY', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
      { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
      { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
      { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
      { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
      { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '17:00', isWorkingDay: false },
      { dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '17:00', isWorkingDay: false },
    ],
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'Morning Shift',
    description: 'Monday to Friday, 6 AM to 2 PM',
    slots: [
      { dayOfWeek: 'SUNDAY', startTime: '06:00', endTime: '14:00', isWorkingDay: true },
      { dayOfWeek: 'MONDAY', startTime: '06:00', endTime: '14:00', isWorkingDay: true },
      { dayOfWeek: 'TUESDAY', startTime: '06:00', endTime: '14:00', isWorkingDay: true },
      { dayOfWeek: 'WEDNESDAY', startTime: '06:00', endTime: '14:00', isWorkingDay: true },
      { dayOfWeek: 'THURSDAY', startTime: '06:00', endTime: '14:00', isWorkingDay: true },
      { dayOfWeek: 'FRIDAY', startTime: '06:00', endTime: '14:00', isWorkingDay: false },
      { dayOfWeek: 'SATURDAY', startTime: '06:00', endTime: '14:00', isWorkingDay: false },
    ],
    createdAt: '2024-01-02',
  },
  {
    id: '3',
    name: 'Evening Shift',
    description: 'Monday to Friday, 2 PM to 10 PM',
    slots: [
      { dayOfWeek: 'SUNDAY', startTime: '14:00', endTime: '22:00', isWorkingDay: true },
      { dayOfWeek: 'MONDAY', startTime: '14:00', endTime: '22:00', isWorkingDay: true },
      { dayOfWeek: 'TUESDAY', startTime: '14:00', endTime: '22:00', isWorkingDay: true },
      { dayOfWeek: 'WEDNESDAY', startTime: '14:00', endTime: '22:00', isWorkingDay: true },
      { dayOfWeek: 'THURSDAY', startTime: '14:00', endTime: '22:00', isWorkingDay: true },
      { dayOfWeek: 'FRIDAY', startTime: '14:00', endTime: '22:00', isWorkingDay: false },
      { dayOfWeek: 'SATURDAY', startTime: '14:00', endTime: '22:00', isWorkingDay: false },
    ],
    createdAt: '2024-01-03',
  },
];

const defaultSlots: TemplateSlot[] = DAYS_OF_WEEK.map((day) => ({
  dayOfWeek: day,
  startTime: '09:00',
  endTime: '17:00',
  isWorkingDay: !['FRIDAY', 'SATURDAY'].includes(day),
}));

export default function ScheduleTemplatesPage() {
  const t = useTranslations();
  const [templates, setTemplates] = React.useState(mockTemplates);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<ScheduleTemplate | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    slots: [...defaultSlots],
  });

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      slots: [...defaultSlots],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (template: ScheduleTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      slots: [...template.slots],
    });
    setIsDialogOpen(true);
  };

  const handleSlotChange = (dayOfWeek: DayOfWeek, field: keyof TemplateSlot, value: string | boolean) => {
    setFormData({
      ...formData,
      slots: formData.slots.map((slot) =>
        slot.dayOfWeek === dayOfWeek ? { ...slot, [field]: value } : slot
      ),
    });
  };

  const handleSave = () => {
    if (editingTemplate) {
      setTemplates(
        templates.map((t) =>
          t.id === editingTemplate.id
            ? { ...t, ...formData }
            : t
        )
      );
    } else {
      const newTemplate: ScheduleTemplate = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString().split('T')[0] ?? '',
      };
      setTemplates([...templates, newTemplate]);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
  };

  const handleDuplicate = (template: ScheduleTemplate) => {
    const newTemplate: ScheduleTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString().split('T')[0] ?? '',
    };
    setTemplates([...templates, newTemplate]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/scheduling">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('scheduling.templates') || 'Schedule Templates'}
            </h1>
            <p className="text-muted-foreground">
              {t('scheduling.templatesDescription') || 'Create reusable schedule patterns'}
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="me-2 h-4 w-4" />
              {t('scheduling.newTemplate') || 'New Template'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate
                  ? t('scheduling.editTemplate') || 'Edit Template'
                  : t('scheduling.newTemplate') || 'New Template'}
              </DialogTitle>
              <DialogDescription>
                {t('scheduling.templateFormDescription') ||
                  'Define the working hours for each day of the week'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">{t('scheduling.templateName') || 'Template Name'}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Standard Week"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">{t('common.description') || 'Description'}</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Monday to Friday, 9 AM to 5 PM"
                  />
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('common.day') || 'Day'}</TableHead>
                      <TableHead className="text-center">{t('scheduling.workingDay') || 'Working'}</TableHead>
                      <TableHead>{t('scheduling.startTime') || 'Start'}</TableHead>
                      <TableHead>{t('scheduling.endTime') || 'End'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.slots.map((slot) => (
                      <TableRow key={slot.dayOfWeek}>
                        <TableCell className="font-medium">
                          {t(`common.${slot.dayOfWeek.toLowerCase()}`) || dayLabels[slot.dayOfWeek]}
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={slot.isWorkingDay}
                            onCheckedChange={(checked) =>
                              handleSlotChange(slot.dayOfWeek, 'isWorkingDay', !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) =>
                              handleSlotChange(slot.dayOfWeek, 'startTime', e.target.value)
                            }
                            disabled={!slot.isWorkingDay}
                            className="w-28"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) =>
                              handleSlotChange(slot.dayOfWeek, 'endTime', e.target.value)
                            }
                            disabled={!slot.isWorkingDay}
                            className="w-28"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button onClick={handleSave} disabled={!formData.name}>
                {t('common.save') || 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const workingDays = template.slots.filter((s) => s.isWorkingDay).length;
          const firstWorkingSlot = template.slots.find((s) => s.isWorkingDay);

          return (
            <Card key={template.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {template.name}
                  </CardTitle>
                  {template.description && (
                    <CardDescription>{template.description}</CardDescription>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(template)}>
                      <Edit className="me-2 h-4 w-4" />
                      {t('common.edit') || 'Edit'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                      <Copy className="me-2 h-4 w-4" />
                      {t('common.duplicate') || 'Duplicate'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(template.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="me-2 h-4 w-4" />
                      {t('common.delete') || 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {firstWorkingSlot
                        ? `${firstWorkingSlot.startTime} - ${firstWorkingSlot.endTime}`
                        : t('scheduling.noWorkingDays') || 'No working days'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {template.slots.map((slot) => (
                      <Badge
                        key={slot.dayOfWeek}
                        variant={slot.isWorkingDay ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {dayLabels[slot.dayOfWeek]}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {workingDays} {t('scheduling.workingDays') || 'working days'} / {t('common.week') || 'week'}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
