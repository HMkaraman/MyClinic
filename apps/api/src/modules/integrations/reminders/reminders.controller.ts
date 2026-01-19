import {
  Controller,
  Post,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Audit } from '../../audit/decorators/audit.decorator';
import { RemindersService } from './reminders.service';

@ApiTags('Reminders')
@ApiBearerAuth()
@Controller('reminders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post('appointment/:appointmentId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.RECEPTION)
  @Audit({ action: 'send', entityType: 'reminder', entityIdParam: 'appointmentId' })
  @ApiOperation({ summary: 'Send a manual reminder for an appointment' })
  @ApiQuery({
    name: 'channel',
    enum: ['sms', 'whatsapp'],
    description: 'Communication channel to use',
  })
  @ApiResponse({ status: 200, description: 'Reminder sent' })
  @ApiResponse({ status: 400, description: 'Failed to send reminder' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async sendManualReminder(
    @CurrentUser() user: { tenantId: string; id: string },
    @Param('appointmentId') appointmentId: string,
    @Query('channel') channel: 'sms' | 'whatsapp',
  ) {
    if (!channel || !['sms', 'whatsapp'].includes(channel)) {
      throw new BadRequestException('Invalid channel. Must be "sms" or "whatsapp"');
    }

    try {
      const success = await this.remindersService.sendManualReminder(
        user.tenantId,
        appointmentId,
        channel,
        user.id,
      );

      return {
        success,
        message: success ? 'Reminder sent successfully' : 'Failed to send reminder',
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to send reminder',
      );
    }
  }
}
