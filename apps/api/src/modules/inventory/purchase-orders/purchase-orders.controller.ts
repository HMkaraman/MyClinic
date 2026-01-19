import {
  Controller,
  Get,
  Post,
  Patch,
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

import { PurchaseOrdersService } from './purchase-orders.service';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ReceiveItemsDto,
  QueryPurchaseOrdersDto,
} from './dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../auth/decorators/current-user.decorator';
import { Audit } from '../../audit/decorators/audit.decorator';

@ApiTags('inventory-purchase-orders')
@ApiBearerAuth()
@Controller('inventory/purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List all purchase orders (paginated)' })
  @ApiResponse({ status: 200, description: 'List of purchase orders' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryPurchaseOrdersDto,
  ) {
    return this.purchaseOrdersService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase order by ID' })
  @ApiResponse({ status: 200, description: 'Purchase order found' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.purchaseOrdersService.findById(user.tenantId, id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'create', entityType: 'PurchaseOrder' })
  @ApiOperation({ summary: 'Create a new purchase order' })
  @ApiResponse({ status: 201, description: 'Purchase order created' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.create(user.tenantId, dto, user.sub);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'update', entityType: 'PurchaseOrder', entityIdParam: 'id', captureBeforeState: true })
  @ApiOperation({ summary: 'Update purchase order (draft only)' })
  @ApiResponse({ status: 200, description: 'Purchase order updated' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.update(user.tenantId, id, dto, user.sub);
  }

  @Post(':id/submit')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'submit_for_approval', entityType: 'PurchaseOrder', entityIdParam: 'id' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit purchase order for approval' })
  @ApiResponse({ status: 200, description: 'Purchase order submitted' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async submitForApproval(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.purchaseOrdersService.submitForApproval(user.tenantId, id, user.sub);
  }

  @Post(':id/approve')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'approve', entityType: 'PurchaseOrder', entityIdParam: 'id' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve purchase order' })
  @ApiResponse({ status: 200, description: 'Purchase order approved' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async approve(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.purchaseOrdersService.approve(user.tenantId, id, user.sub);
  }

  @Post(':id/mark-ordered')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'mark_ordered', entityType: 'PurchaseOrder', entityIdParam: 'id' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark purchase order as ordered with supplier' })
  @ApiResponse({ status: 200, description: 'Purchase order marked as ordered' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async markOrdered(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.purchaseOrdersService.markOrdered(user.tenantId, id, user.sub);
  }

  @Post(':id/receive')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'receive_items', entityType: 'PurchaseOrder', entityIdParam: 'id' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive items from purchase order' })
  @ApiResponse({ status: 200, description: 'Items received' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async receiveItems(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReceiveItemsDto,
  ) {
    return this.purchaseOrdersService.receiveItems(user.tenantId, id, dto, user.sub);
  }

  @Post(':id/cancel')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'cancel', entityType: 'PurchaseOrder', entityIdParam: 'id' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel purchase order' })
  @ApiResponse({ status: 200, description: 'Purchase order cancelled' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.purchaseOrdersService.cancel(user.tenantId, id, user.sub);
  }
}
