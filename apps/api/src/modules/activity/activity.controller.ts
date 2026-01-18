import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import { ActivityService } from './activity.service';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('activity')
@ApiBearerAuth()
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('timeline/:entityType/:entityId')
  @ApiOperation({ summary: 'Get activity timeline for an entity' })
  @ApiResponse({ status: 200, description: 'Timeline retrieved' })
  async getEntityTimeline(
    @CurrentUser() user: JwtPayload,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.activityService.getEntityTimeline(user.tenantId, entityType, entityId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get activity for a specific user' })
  @ApiResponse({ status: 200, description: 'User activity retrieved' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserActivity(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.activityService.getUserActivity(user.tenantId, userId, limit || 50);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user activity' })
  @ApiResponse({ status: 200, description: 'Activity retrieved' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyActivity(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: number,
  ) {
    return this.activityService.getUserActivity(user.tenantId, user.sub, limit || 50);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent activity' })
  @ApiResponse({ status: 200, description: 'Recent activity retrieved' })
  @ApiQuery({ name: 'entityTypes', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentActivity(
    @CurrentUser() user: JwtPayload,
    @Query('entityTypes') entityTypes?: string,
    @Query('limit') limit?: number,
  ) {
    const types = entityTypes ? entityTypes.split(',') : undefined;
    return this.activityService.getRecentActivity(user.tenantId, types, limit || 50);
  }
}
