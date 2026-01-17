import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

import { JwtPayload } from '../../auth/decorators/current-user.decorator';

// Extend Express Request to include tenant info
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      branchId?: string;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant from authenticated user (JWT payload)
    const user = req.user as JwtPayload | undefined;

    if (user?.tenantId) {
      req.tenantId = user.tenantId;
    }

    // Also check for branchId in various places
    const branchId =
      req.params?.branchId ||
      req.query?.branchId ||
      req.body?.branchId;

    if (branchId && typeof branchId === 'string') {
      req.branchId = branchId;
    }

    next();
  }
}
