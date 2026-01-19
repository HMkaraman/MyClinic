import {
  Controller,
  Get,
  Post,
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

import { TimeOffService } from './time-off.service';
import { CreateTimeOffDto, ReviewTimeOffDto, QueryTimeOffDto } from './dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../auth/decorators/current-user.decorator';
import { Audit } from '../../audit/decorators/audit.decorator';

@ApiTags('time-off')
@ApiBearerAuth()
@Controller('scheduling/time-off')
export class TimeOffController {
  constructor(private readonly timeOffService: TimeOffService) {}

  @Get()
  @ApiOperation({ summary: 'List time off requests' })
  @ApiResponse({ status: 200, description: 'List of time off requests' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryTimeOffDto,
  ) {
    return this.timeOffService.findAll(user.tenantId, query, user.sub, user.role);
  }

  @Get('pending/count')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get count of pending time off requests' })
  @ApiResponse({ status: 200, description: 'Pending count' })
  async getPendingCount(@CurrentUser() user: JwtPayload) {
    return this.timeOffService.getPendingCount(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get time off request by ID' })
  @ApiResponse({ status: 200, description: 'Time off request found' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  async findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.timeOffService.findById(user.tenantId, id, user.sub, user.role);
  }

  @Post()
  @Audit({ action: 'create', entityType: 'TimeOffRequest' })
  @ApiOperation({ summary: 'Create a time off request' })
  @ApiResponse({ status: 201, description: 'Request created' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTimeOffDto,
  ) {
    return this.timeOffService.create(user.tenantId, dto, user.sub);
  }

  @Post(':id/review')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'review', entityType: 'TimeOffRequest', entityIdParam: 'id' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review (approve/reject) time off request' })
  @ApiResponse({ status: 200, description: 'Request reviewed' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  async review(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReviewTimeOffDto,
  ) {
    return this.timeOffService.review(user.tenantId, id, dto, user.sub);
  }

  @Post(':id/cancel')
  @Audit({ action: 'cancel', entityType: 'TimeOffRequest', entityIdParam: 'id' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel time off request' })
  @ApiResponse({ status: 200, description: 'Request cancelled' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  async cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.timeOffService.cancel(user.tenantId, id, user.sub, user.role);
  }
}
