import { Injectable } from '@nestjs/common';
import type { NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { tenantContext } from '../context/tenant-context';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user as { tenantId: string; sub: string } | undefined;
    if (user?.tenantId) {
      tenantContext.run({ tenantId: user.tenantId, userId: user.sub }, () => {
        next();
      });
    } else {
      next();
    }
  }
}
