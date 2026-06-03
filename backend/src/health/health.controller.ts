import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      // Remover uptime em produção (informação sensível)
      ...(process.env.NODE_ENV !== 'production' && {
        uptime: process.uptime(),
      }),
    };
  }
}
