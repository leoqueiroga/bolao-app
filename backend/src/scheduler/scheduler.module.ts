import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [SupabaseModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
