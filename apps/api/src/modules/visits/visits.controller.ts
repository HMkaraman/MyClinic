import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { VisitsService } from './visits.service';
import { CreateVisitDto, UpdateVisitDto, QueryVisitsDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Audit } from '../audit/decorators/audit.decorator';

@ApiTags('visits')
@ApiBearerAuth()
@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get()
  @Roles(Role.DOCTOR, Role.NURSE, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'List visits (paginated, medical staff only)' })
  @ApiResponse({ status: 200, description: 'List of visits' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryVisitsDto,
  ) {
    return this.visitsService.findAll(user, query);
  }

  @Get(':id')
  @Roles(Role.DOCTOR, Role.NURSE, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get visit by ID' })
  @ApiResponse({ status: 200, description: 'Visit found' })
  @ApiResponse({ status: 404, description: 'Visit not found' })
  async findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.visitsService.findById(user, id);
  }

  @Post()
  @Roles(Role.DOCTOR, Role.NURSE)
  @Audit({ action: 'create', entityType: 'Visit' })
  @ApiOperation({ summary: 'Create a new visit (medical staff only)' })
  @ApiResponse({ status: 201, description: 'Visit created' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateVisitDto,
  ) {
    return this.visitsService.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.DOCTOR, Role.NURSE)
  @Audit({ action: 'update', entityType: 'Visit', entityIdParam: 'id', captureBeforeState: true })
  @ApiOperation({ summary: 'Update visit' })
  @ApiResponse({ status: 200, description: 'Visit updated' })
  @ApiResponse({ status: 404, description: 'Visit not found' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateVisitDto,
  ) {
    return this.visitsService.update(user, id, dto);
  }
}

// Separate controller for patient-scoped visits
@ApiTags('patients')
@ApiBearerAuth()
@Controller('patients')
export class PatientVisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get(':id/visits')
  @Roles(Role.DOCTOR, Role.NURSE, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get patient visit history' })
  @ApiResponse({ status: 200, description: 'Patient visits' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async getPatientVisits(
    @CurrentUser() user: JwtPayload,
    @Param('id') patientId: string,
  ) {
    return this.visitsService.getPatientVisits(user, patientId);
  }
}
