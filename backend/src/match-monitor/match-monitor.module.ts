import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { FootballDataClient } from './football-data.client';
import { MatchMonitorService } from './match-monitor.service';
import { RateLimiterService } from './rate-limiter.service';
import { CompetitionSyncService } from './competition-sync.service';

@Module({
  imports: [SupabaseModule, SchedulerModule, ConfigModule],
  providers: [
    RateLimiterService,
    FootballDataClient,
    MatchMonitorService,
    CompetitionSyncService,
  ],
  exports: [
    RateLimiterService,
    FootballDataClient,
    MatchMonitorService,
    CompetitionSyncService,
  ],
})
export class MatchMonitorModule {}
