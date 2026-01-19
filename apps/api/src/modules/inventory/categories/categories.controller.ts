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

import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto, QueryCategoriesDto } from './dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../auth/decorators/current-user.decorator';
import { Audit } from '../../audit/decorators/audit.decorator';

@ApiTags('inventory-categories')
@ApiBearerAuth()
@Controller('inventory/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all inventory categories (paginated)' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryCategoriesDto,
  ) {
    return this.categoriesService.findAll(user.tenantId, query);
  }

  @Get('hierarchy')
  @ApiOperation({ summary: 'Get category hierarchy (tree structure)' })
  @ApiResponse({ status: 200, description: 'Category hierarchy' })
  async getHierarchy(@CurrentUser() user: JwtPayload) {
    return this.categoriesService.getHierarchy(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.categoriesService.findById(user.tenantId, id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'create', entityType: 'InventoryCategory' })
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(user.tenantId, dto, user.sub);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'update', entityType: 'InventoryCategory', entityIdParam: 'id', captureBeforeState: true })
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(user.tenantId, id, dto, user.sub);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'delete', entityType: 'InventoryCategory', entityIdParam: 'id', captureBeforeState: true })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.categoriesService.delete(user.tenantId, id, user.sub);
  }
}
