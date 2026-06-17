import { Module, forwardRef } from '@nestjs/common';
import { MatchMonitorModule } from '../match-monitor/match-monitor.module';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';

@Module({
  imports: [forwardRef(() => SchedulerModule), MatchMonitorModule],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
