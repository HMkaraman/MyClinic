import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MovementType } from '@prisma/client';

import { MovementsService } from './movements.service';
import { CurrentUser, JwtPayload } from '../../auth/decorators/current-user.decorator';

@ApiTags('inventory-movements')
@ApiBearerAuth()
@Controller('inventory/movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Get()
  @ApiOperation({ summary: 'List all inventory movements (paginated)' })
  @ApiResponse({ status: 200, description: 'List of movements' })
  @ApiQuery({ name: 'itemId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: MovementType })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'performedBy', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('itemId') itemId?: string,
    @Query('type') type?: MovementType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('performedBy') performedBy?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.movementsService.findAll(user.tenantId, {
      itemId,
      type,
      startDate,
      endDate,
      performedBy,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get movement summary by type' })
  @ApiResponse({ status: 200, description: 'Movement summary' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getSummary(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.movementsService.getMovementSummary(user.tenantId, startDate, endDate);
  }

  @Get('item/:itemId')
  @ApiOperation({ summary: 'Get movements for a specific item' })
  @ApiResponse({ status: 200, description: 'Item movements' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async findByItem(
    @CurrentUser() user: JwtPayload,
    @Param('itemId') itemId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.movementsService.findByItem(
      user.tenantId,
      itemId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
}
