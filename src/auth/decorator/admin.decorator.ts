import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Role } from 'src/enum/role';
import { AdminGuard } from '../guards/admin.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Roles } from './roles.decorator';

export function AdminEndpoint(
  summary: string,
  statusCode = 200,
  description?: string,
) {
  return applyDecorators(
    UseGuards(JwtAuthGuard, AdminGuard),
    Roles(Role.ADMIN),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: `ADMIN: ${summary}` }),
    ApiResponse({
      status: statusCode,
      description:
        description || `${summary} operation completed successfully.`,
    }),
  );
}