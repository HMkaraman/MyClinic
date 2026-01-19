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

import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto, QuerySuppliersDto } from './dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../auth/decorators/current-user.decorator';
import { Audit } from '../../audit/decorators/audit.decorator';

@ApiTags('inventory-suppliers')
@ApiBearerAuth()
@Controller('inventory/suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiOperation({ summary: 'List all suppliers (paginated)' })
  @ApiResponse({ status: 200, description: 'List of suppliers' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: QuerySuppliersDto,
  ) {
    return this.suppliersService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  @ApiResponse({ status: 200, description: 'Supplier found' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.suppliersService.findById(user.tenantId, id);
  }

  @Get(':id/items')
  @ApiOperation({ summary: 'Get items from this supplier' })
  @ApiResponse({ status: 200, description: 'Supplier items' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async getSupplierItems(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.suppliersService.getSupplierItems(user.tenantId, id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'create', entityType: 'Supplier' })
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.suppliersService.create(user.tenantId, dto, user.sub);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'update', entityType: 'Supplier', entityIdParam: 'id', captureBeforeState: true })
  @ApiOperation({ summary: 'Update supplier' })
  @ApiResponse({ status: 200, description: 'Supplier updated' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(user.tenantId, id, dto, user.sub);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'delete', entityType: 'Supplier', entityIdParam: 'id', captureBeforeState: true })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete supplier' })
  @ApiResponse({ status: 200, description: 'Supplier deleted' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.suppliersService.delete(user.tenantId, id, user.sub);
  }
}
