import { Module } from '@nestjs/common';
import { BetTypesController } from './bet-types.controller';
import { BetTypesService } from './bet-types.service';

@Module({
  controllers: [BetTypesController],
  providers: [BetTypesService],
  exports: [BetTypesService],
})
export class BetTypesModule {}
