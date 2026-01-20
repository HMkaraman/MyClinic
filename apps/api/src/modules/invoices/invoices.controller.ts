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

import { InvoicesService } from './invoices.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  QueryInvoicesDto,
  AddPaymentDto,
} from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Audit } from '../audit/decorators/audit.decorator';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @Roles(Role.ACCOUNTANT, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'List invoices (paginated)' })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryInvoicesDto,
  ) {
    return this.invoicesService.findAll(user, query);
  }

  @Get('stats/finance')
  @Roles(Role.ACCOUNTANT, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get finance statistics' })
  @ApiResponse({ status: 200, description: 'Finance stats' })
  async getFinanceStats(@CurrentUser() user: JwtPayload) {
    return this.invoicesService.getFinanceStats(user);
  }

  @Get(':id')
  @Roles(Role.ACCOUNTANT, Role.ADMIN, Role.MANAGER, Role.RECEPTION)
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice found' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.invoicesService.findById(user, id);
  }

  @Post()
  @Roles(Role.ACCOUNTANT, Role.RECEPTION, Role.ADMIN)
  @Audit({ action: 'create', entityType: 'Invoice' })
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.ACCOUNTANT, Role.ADMIN)
  @Audit({ action: 'update', entityType: 'Invoice', entityIdParam: 'id', captureBeforeState: true })
  @ApiOperation({ summary: 'Update invoice' })
  @ApiResponse({ status: 200, description: 'Invoice updated' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({ status: 400, description: 'Cannot update paid/cancelled invoice' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(user, id, dto);
  }

  @Post(':id/payments')
  @Roles(Role.ACCOUNTANT, Role.RECEPTION, Role.ADMIN)
  @Audit({ action: 'add_payment', entityType: 'Invoice', entityIdParam: 'id' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add payment to invoice' })
  @ApiResponse({ status: 200, description: 'Payment added' })
  @ApiResponse({ status: 400, description: 'Cannot add payment or amount exceeds balance' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async addPayment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AddPaymentDto,
  ) {
    return this.invoicesService.addPayment(user, id, dto);
  }
}

// Separate controller for patient-scoped invoices
@ApiTags('patients')
@ApiBearerAuth()
@Controller('patients')
export class PatientInvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get(':id/invoices')
  @Roles(Role.ACCOUNTANT, Role.ADMIN, Role.MANAGER, Role.RECEPTION)
  @ApiOperation({ summary: 'Get patient invoices' })
  @ApiResponse({ status: 200, description: 'Patient invoices' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async getPatientInvoices(
    @CurrentUser() user: JwtPayload,
    @Param('id') patientId: string,
  ) {
    return this.invoicesService.getPatientInvoices(user, patientId);
  }
}
