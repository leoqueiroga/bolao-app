import { BadRequestException, Injectable } from '@nestjs/common';
import { BetType } from '../common/types';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class BetTypesService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(): Promise<BetType[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('bet_types')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async findActive(): Promise<BetType[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('bet_types')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async findOne(id: string): Promise<BetType> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('bet_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new BadRequestException('Bet type not found');
    }

    return data;
  }
}
