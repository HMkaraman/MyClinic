import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, Role, TaskStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateTaskDto, UpdateTaskDto, QueryTasksDto } from './dto';
import { JwtPayload } from '../auth/decorators/current-user.decorator';

const ADMIN_ROLES: Role[] = [Role.ADMIN, Role.MANAGER];

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) {}

  async findAll(user: JwtPayload, query: QueryTasksDto) {
    const {
      assignedTo,
      myTasks,
      entityType,
      entityId,
      status,
      priority,
      overdue,
      dueDateFrom,
      dueDateTo,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page! - 1) * limit!;

    const where: Prisma.TaskWhereInput = {
      tenantId: user.tenantId,
    };

    if (myTasks) {
      where.assignedTo = user.sub;
    } else if (assignedTo) {
      where.assignedTo = assignedTo;
    } else if (!ADMIN_ROLES.includes(user.role)) {
      // Non-admin users can only see their own tasks
      where.assignedTo = user.sub;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (overdue) {
      where.dueDate = { lt: new Date() };
      where.status = { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] };
    }

    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) {
        where.dueDate.gte = new Date(dueDateFrom);
      }
      if (dueDateTo) {
        where.dueDate.lte = new Date(dueDateTo);
      }
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy!]: sortOrder },
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      meta: {
        total,
        page: page!,
        limit: limit!,
        totalPages: Math.ceil(total / limit!),
      },
    };
  }

  async findById(user: JwtPayload, id: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Non-admin users can only see their own tasks or tasks they created
    if (
      !ADMIN_ROLES.includes(user.role) &&
      task.assignedTo !== user.sub &&
      task.createdBy !== user.sub
    ) {
      throw new ForbiddenException('Access denied to this task');
    }

    return task;
  }

  async create(user: JwtPayload, dto: CreateTaskDto) {
    const task = await this.prisma.task.create({
      data: {
        tenantId: user.tenantId,
        title: dto.title,
        description: dto.description,
        entityType: dto.entityType,
        entityId: dto.entityId,
        assignedTo: dto.assignedTo,
        dueDate: new Date(dto.dueDate),
        priority: dto.priority,
        createdBy: user.sub,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log activity on the related entity
    await this.activityService.logTaskActivity(
      user.tenantId,
      task.entityType,
      task.entityId,
      'task_created',
      user.sub,
      { taskId: task.id, title: task.title, assignedTo: task.assignedTo },
    );

    return task;
  }

  async update(user: JwtPayload, id: string, dto: UpdateTaskDto) {
    const existing = await this.findById(user, id);

    // Only admin, manager, creator, or assignee can update
    if (
      !ADMIN_ROLES.includes(user.role) &&
      existing.createdBy !== user.sub &&
      existing.assignedTo !== user.sub
    ) {
      throw new ForbiddenException('Not allowed to update this task');
    }

    const updateData: any = { ...dto };
    if (dto.dueDate) {
      updateData.dueDate = new Date(dto.dueDate);
    }

    // Set completedAt if status is COMPLETED
    if (dto.status === TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    } else if (dto.status) {
      updateData.completedAt = null;
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log activity
    await this.activityService.logTaskActivity(
      user.tenantId,
      task.entityType,
      task.entityId,
      'task_updated',
      user.sub,
      { taskId: task.id, updatedFields: Object.keys(dto) },
    );

    return task;
  }

  async changeStatus(user: JwtPayload, id: string, status: TaskStatus) {
    const task = await this.findById(user, id);

    // Only admin, manager, creator, or assignee can change status
    if (
      !ADMIN_ROLES.includes(user.role) &&
      task.createdBy !== user.sub &&
      task.assignedTo !== user.sub
    ) {
      throw new ForbiddenException('Not allowed to update this task');
    }

    const updateData: any = { status };
    if (status === TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log activity
    await this.activityService.logTaskActivity(
      user.tenantId,
      updatedTask.entityType,
      updatedTask.entityId,
      'task_status_changed',
      user.sub,
      { taskId: updatedTask.id, from: task.status, to: status },
    );

    return updatedTask;
  }

  async reassign(user: JwtPayload, id: string, newAssignee: string) {
    const task = await this.findById(user, id);

    // Only admin, manager, or creator can reassign
    if (!ADMIN_ROLES.includes(user.role) && task.createdBy !== user.sub) {
      throw new ForbiddenException('Not allowed to reassign this task');
    }

    const previousAssignee = task.assignedTo;

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: { assignedTo: newAssignee },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log activity
    await this.activityService.logTaskActivity(
      user.tenantId,
      updatedTask.entityType,
      updatedTask.entityId,
      'task_reassigned',
      user.sub,
      { taskId: updatedTask.id, from: previousAssignee, to: newAssignee },
    );

    return updatedTask;
  }

  async delete(user: JwtPayload, id: string) {
    const task = await this.findById(user, id);

    // Only admin, manager, or creator can delete
    if (!ADMIN_ROLES.includes(user.role) && task.createdBy !== user.sub) {
      throw new ForbiddenException('Not allowed to delete this task');
    }

    await this.prisma.task.delete({ where: { id } });

    // Log activity
    await this.activityService.logTaskActivity(
      user.tenantId,
      task.entityType,
      task.entityId,
      'task_deleted',
      user.sub,
      { taskId: task.id, title: task.title },
    );

    return { message: 'Task deleted successfully' };
  }

  async getMyTasksSummary(user: JwtPayload) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const [pending, overdue, dueToday, completed] = await Promise.all([
      this.prisma.task.count({
        where: {
          tenantId: user.tenantId,
          assignedTo: user.sub,
          status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
        },
      }),
      this.prisma.task.count({
        where: {
          tenantId: user.tenantId,
          assignedTo: user.sub,
          status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
          dueDate: { lt: today },
        },
      }),
      this.prisma.task.count({
        where: {
          tenantId: user.tenantId,
          assignedTo: user.sub,
          status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
          dueDate: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.task.count({
        where: {
          tenantId: user.tenantId,
          assignedTo: user.sub,
          status: TaskStatus.COMPLETED,
        },
      }),
    ]);

    return {
      pending,
      overdue,
      dueToday,
      completed,
    };
  }
}
