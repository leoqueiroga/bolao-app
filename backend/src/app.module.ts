import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { SupabaseAuthGuard } from './auth/guards/supabase-auth.guard';
import { BetTypesModule } from './bet-types/bet-types.module';
import { BetsModule } from './bets/bets.module';
import { CompetitionsModule } from './competitions/competitions.module';
import { validate } from './config/env.validation';
import { DashboardModule } from './dashboard/dashboard.module';
import { GamesModule } from './games/games.module';
import { HealthModule } from './health/health.module';
import { RankingModule } from './ranking/ranking.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SupabaseModule } from './supabase/supabase.module';
import { ChampionsModule } from './champions/champions.module';
import { MatchMonitorModule } from './match-monitor/match-monitor.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    SupabaseModule,
    AuthModule,
    GamesModule,
    BetsModule,
    CompetitionsModule,
    BetTypesModule,
    RankingModule,
    DashboardModule,
    HealthModule,
    UsersModule,
    ChampionsModule,
    SchedulerModule,
    MatchMonitorModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
  ],
})
export class AppModule {}
