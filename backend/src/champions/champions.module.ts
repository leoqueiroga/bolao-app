import { Module } from '@nestjs/common';
import { ChampionsController } from './champions.controller';
import { ChampionsService } from './champions.service';

@Module({
  controllers: [ChampionsController],
  providers: [ChampionsService],
  exports: [ChampionsService],
})
export class ChampionsModule {}
