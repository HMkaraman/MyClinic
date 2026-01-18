import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface SetupTokenPayload {
  sub: string;
  tenantId: string;
  purpose: string;
}

@Injectable()
export class SetupTokenGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify<SetupTokenPayload>(token, {
        secret: this.configService.get<string>(
          'JWT_SECRET',
          'myclinic-jwt-secret',
        ),
      });

      // Verify this is a setup token
      if (payload.purpose !== '2fa-setup') {
        throw new UnauthorizedException('Invalid token purpose');
      }

      // Attach user info to request
      request.user = {
        sub: payload.sub,
        tenantId: payload.tenantId,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired setup token');
    }
  }
}
