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

import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto, QueryPatientsDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Audit } from '../audit/decorators/audit.decorator';

@ApiTags('patients')
@ApiBearerAuth()
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'List all patients (paginated, branch-scoped)' })
  @ApiResponse({ status: 200, description: 'List of patients' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryPatientsDto,
  ) {
    return this.patientsService.findAll(user, query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search patients by phone/name/file number' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(
    @CurrentUser() user: JwtPayload,
    @Query('q') searchTerm: string,
  ) {
    return this.patientsService.search(user, searchTerm || '');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  @ApiResponse({ status: 200, description: 'Patient found' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.patientsService.findById(user, id);
  }

  @Post()
  @Roles(Role.RECEPTION, Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'create', entityType: 'Patient' })
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiResponse({ status: 201, description: 'Patient created' })
  @ApiResponse({ status: 409, description: 'Duplicate phone number' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePatientDto,
  ) {
    return this.patientsService.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.RECEPTION, Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'update', entityType: 'Patient', entityIdParam: 'id', captureBeforeState: true })
  @ApiOperation({ summary: 'Update patient' })
  @ApiResponse({ status: 200, description: 'Patient updated' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @ApiResponse({ status: 409, description: 'Duplicate phone number' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientsService.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @Audit({ action: 'delete', entityType: 'Patient', entityIdParam: 'id', captureBeforeState: true })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete patient (soft delete)' })
  @ApiResponse({ status: 200, description: 'Patient deleted' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.patientsService.delete(user, id);
  }
}
