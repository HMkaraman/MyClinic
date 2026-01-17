import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

import { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class BranchGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get branchId from request params, query, or body
    const branchId =
      request.params?.branchId ||
      request.query?.branchId ||
      request.body?.branchId;

    if (!branchId) {
      // No branch specified, allow access (tenant-level operation)
      return true;
    }

    // Check if user has access to the requested branch
    if (!user.branchIds.includes(branchId)) {
      throw new ForbiddenException(
        'You do not have access to this branch',
      );
    }

    return true;
  }
}
