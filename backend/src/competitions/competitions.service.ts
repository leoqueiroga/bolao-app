import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Competition } from '../common/types';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCompetitionDto, UpdateCompetitionDto } from './dto';

@Injectable()
export class CompetitionsService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(): Promise<Competition[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .order('year', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async findActive(): Promise<Competition[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async findOne(id: string): Promise<Competition> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Competition not found');
    }

    return data;
  }

  async create(
    createCompetitionDto: CreateCompetitionDto,
  ): Promise<Competition> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('competitions')
      .insert({
        ...createCompetitionDto,
        score_multiplier: createCompetitionDto.score_multiplier || 1,
        is_active: createCompetitionDto.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async update(
    id: string,
    updateCompetitionDto: UpdateCompetitionDto,
  ): Promise<Competition> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('competitions')
      .update({
        ...updateCompetitionDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async remove(id: string): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase.from('competitions').delete().eq('id', id);

    if (error) {
      throw new BadRequestException(error.message);
    }
  }
}
