import { Module, forwardRef } from '@nestjs/common';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';

@Module({
  imports: [forwardRef(() => SchedulerModule)],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
