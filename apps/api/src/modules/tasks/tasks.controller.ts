import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  QueryTasksDto,
  ChangeStatusDto,
  ReassignTaskDto,
} from './dto';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Audit } from '../audit/decorators/audit.decorator';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks' })
  @ApiResponse({ status: 200, description: 'Returns paginated tasks' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryTasksDto,
  ) {
    return this.tasksService.findAll(user, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get my tasks summary' })
  @ApiResponse({ status: 200, description: 'Returns task counts' })
  async getMyTasksSummary(@CurrentUser() user: JwtPayload) {
    return this.tasksService.getMyTasksSummary(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, description: 'Returns task details' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.tasksService.findById(user, id);
  }

  @Post()
  @Audit({ entityType: 'Task', action: 'create' })
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(user, dto);
  }

  @Patch(':id')
  @Audit({ entityType: 'Task', action: 'update' })
  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({ status: 200, description: 'Task updated' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user, id, dto);
  }

  @Post(':id/status')
  @Audit({ entityType: 'Task', action: 'change_status' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change task status' })
  @ApiResponse({ status: 200, description: 'Status changed' })
  async changeStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    return this.tasksService.changeStatus(user, id, dto.status);
  }

  @Post(':id/reassign')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ entityType: 'Task', action: 'reassign' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reassign task to another user' })
  @ApiResponse({ status: 200, description: 'Task reassigned' })
  async reassign(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReassignTaskDto,
  ) {
    return this.tasksService.reassign(user, id, dto.assignedTo);
  }

  @Delete(':id')
  @Audit({ entityType: 'Task', action: 'delete' })
  @ApiOperation({ summary: 'Delete task' })
  @ApiResponse({ status: 200, description: 'Task deleted' })
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.tasksService.delete(user, id);
  }
}
