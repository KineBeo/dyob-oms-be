import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

export function ProtectedEndpoint(
  summary: string,
  statusCode = 200,
  description?: string,
) {
  return applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary }),
    ApiResponse({
      status: statusCode,
      description:
        description || `${summary} operation completed successfully.`,
    }),
  );
}