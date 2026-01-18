import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, Verify2FADto } from './dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser, JwtPayload } from './decorators/current-user.decorator';
import { Audit } from '../audit/decorators/audit.decorator';
import { SetupTokenGuard } from './guards/setup-token.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Audit({ action: 'LOGIN', entityType: 'User' })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Audit({ action: 'LOGOUT', entityType: 'User' })
  @ApiOperation({ summary: 'Logout and invalidate token' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Req() request: Request) {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await this.authService.logout(token);
    }
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'User data retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }

  @Post('2fa/setup')
  @ApiBearerAuth()
  @Audit({ action: '2FA_SETUP', entityType: 'User' })
  @ApiOperation({ summary: 'Start 2FA setup process' })
  @ApiResponse({ status: 200, description: '2FA setup initiated' })
  @ApiResponse({ status: 400, description: '2FA already enabled' })
  async setup2FA(@CurrentUser() user: JwtPayload) {
    return this.authService.setup2FA(user.sub);
  }

  @Post('2fa/verify')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Audit({ action: '2FA_VERIFY', entityType: 'User' })
  @ApiOperation({ summary: 'Verify and activate 2FA' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid code or setup expired' })
  async verify2FA(
    @CurrentUser() user: JwtPayload,
    @Body() dto: Verify2FADto,
  ) {
    await this.authService.verify2FA(user.sub, dto);
    return { message: '2FA enabled successfully' };
  }

  @Post('2fa/disable')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Audit({ action: '2FA_DISABLE', entityType: 'User' })
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid code or 2FA not enabled' })
  async disable2FA(
    @CurrentUser() user: JwtPayload,
    @Body() dto: Verify2FADto,
  ) {
    await this.authService.disable2FA(user.sub, dto);
    return { message: '2FA disabled successfully' };
  }

  @Post('2fa/setup-required')
  @Public()
  @UseGuards(SetupTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Audit({ action: '2FA_SETUP', entityType: 'User' })
  @ApiOperation({ summary: 'Start 2FA setup process using setup token' })
  @ApiResponse({ status: 200, description: '2FA setup initiated' })
  @ApiResponse({ status: 400, description: '2FA already enabled' })
  @ApiResponse({ status: 401, description: 'Invalid or expired setup token' })
  async setup2FAWithToken(@Req() req: Request) {
    const user = req.user as { sub: string };
    return this.authService.setup2FA(user.sub);
  }

  @Post('2fa/verify-setup')
  @Public()
  @UseGuards(SetupTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Audit({ action: '2FA_VERIFY', entityType: 'User' })
  @ApiOperation({ summary: 'Verify and activate 2FA using setup token' })
  @ApiResponse({ status: 200, description: '2FA enabled and auth tokens returned' })
  @ApiResponse({ status: 400, description: 'Invalid code or setup expired' })
  @ApiResponse({ status: 401, description: 'Invalid or expired setup token' })
  async verify2FAWithToken(
    @Req() req: Request,
    @Body() dto: Verify2FADto,
  ) {
    const user = req.user as { sub: string };
    await this.authService.verify2FA(user.sub, dto);

    // After successful 2FA setup, return full auth tokens
    return this.authService.generateTokensForUser(user.sub);
  }
}
