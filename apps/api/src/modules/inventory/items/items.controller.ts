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

import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto, AdjustStockDto, QueryItemsDto } from './dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../auth/decorators/current-user.decorator';
import { Audit } from '../../audit/decorators/audit.decorator';

@ApiTags('inventory-items')
@ApiBearerAuth()
@Controller('inventory/items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @ApiOperation({ summary: 'List all inventory items (paginated)' })
  @ApiResponse({ status: 200, description: 'List of items' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryItemsDto,
  ) {
    return this.itemsService.findAll(user.tenantId, query);
  }

  @Get('reports/low-stock')
  @ApiOperation({ summary: 'Get low stock report' })
  @ApiResponse({ status: 200, description: 'Low stock items' })
  async getLowStockReport(@CurrentUser() user: JwtPayload) {
    return this.itemsService.getLowStockReport(user.tenantId);
  }

  @Get('reports/expiring')
  @ApiOperation({ summary: 'Get expiring items report' })
  @ApiResponse({ status: 200, description: 'Expiring items' })
  async getExpiringItems(
    @CurrentUser() user: JwtPayload,
    @Query('days') days?: string,
  ) {
    return this.itemsService.getExpiringItems(user.tenantId, days ? parseInt(days) : 30);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item by ID' })
  @ApiResponse({ status: 200, description: 'Item found' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.itemsService.findById(user.tenantId, id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'create', entityType: 'InventoryItem' })
  @ApiOperation({ summary: 'Create a new inventory item' })
  @ApiResponse({ status: 201, description: 'Item created' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateItemDto,
  ) {
    return this.itemsService.create(user.tenantId, dto, user.sub);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'update', entityType: 'InventoryItem', entityIdParam: 'id', captureBeforeState: true })
  @ApiOperation({ summary: 'Update inventory item' })
  @ApiResponse({ status: 200, description: 'Item updated' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.itemsService.update(user.tenantId, id, dto, user.sub);
  }

  @Post(':id/adjust')
  @Roles(Role.ADMIN, Role.MANAGER, Role.NURSE)
  @Audit({ action: 'adjust_stock', entityType: 'InventoryItem', entityIdParam: 'id', captureBeforeState: true })
  @ApiOperation({ summary: 'Adjust stock quantity' })
  @ApiResponse({ status: 200, description: 'Stock adjusted' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async adjustStock(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.itemsService.adjustStock(user.tenantId, id, dto, user.sub);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'delete', entityType: 'InventoryItem', entityIdParam: 'id', captureBeforeState: true })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete inventory item (soft delete)' })
  @ApiResponse({ status: 200, description: 'Item deleted' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.itemsService.delete(user.tenantId, id, user.sub);
  }
}
