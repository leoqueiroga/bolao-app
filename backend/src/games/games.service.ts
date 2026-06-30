import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { Game } from '../common/types';
import { SchedulerService } from '../scheduler/scheduler.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateGameDto, UpdateGameDto } from './dto';

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

  constructor(
    private supabaseService: SupabaseService,
    @Inject(forwardRef(() => SchedulerService))
    private schedulerService: SchedulerService,
  ) {}

  async findAll(filters?: { competition_id?: string; status?: string }) {
    const supabase = this.supabaseService.getAdminClient();

    let query = supabase
      .from('games')
      .select('*, competition:competitions(*)')
      .is('deleted_at', null)
      .order('match_date', { ascending: true });

    if (filters?.competition_id) {
      query = query.eq('competition_id', filters.competition_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data.map((game) => this.enrichGameResponse(game));
  }

  async findUpcoming() {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('games')
      .select('*, competition:competitions(*)')
      .is('deleted_at', null)
      .eq('status', 'scheduled')
      .gte('match_date', new Date().toISOString())
      .order('match_date', { ascending: true })
      .limit(10);

    if (error) throw new BadRequestException(error.message);
    return data.map((game) => this.enrichGameResponse(game));
  }

  async findOne(id: string): Promise<Game & { has_penalties: boolean }> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('games')
      .select('*, competition:competitions(*)')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundException('Game not found');
    return this.enrichGameResponse(data);
  }

  async create(createGameDto: CreateGameDto): Promise<Game> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('games')
      .insert({
        ...createGameDto,
        status: 'scheduled',
        bets_locked: false,
        score_multiplier: createGameDto.score_multiplier || 1,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async update(id: string, updateGameDto: UpdateGameDto): Promise<Game> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: currentGame } = await supabase
      .from('games')
      .select('status')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('games')
      .update({ ...updateGameDto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    if (updateGameDto.status === 'finished' && currentGame?.status !== 'finished') {
      this.schedulerService.calculateGamePoints(id).catch((err) => {
        console.error('Erro ao calcular pontos:', err);
      });
    }

    return data;
  }

  async remove(id: string): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase
      .from('games')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);
  }

  async temporaryUnlock(id: string, minutes: number = 10): Promise<Game> {
    const supabase = this.supabaseService.getAdminClient();

    await this.findOne(id);

    const unlockUntil = new Date(Date.now() + minutes * 60 * 1000);

    const { data, error } = await supabase
      .from('games')
      .update({
        bets_unlock_until: unlockUntil.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  canAcceptBets(game: Game): boolean {
    if (game.bets_unlock_until && new Date(game.bets_unlock_until) > new Date()) {
      return true;
    }
    if (game.bets_locked || game.status !== 'scheduled') {
      return false;
    }
    return new Date() < new Date(game.match_date);
  }

  getResult(game: Game): 'home_win' | 'draw' | 'away_win' | null {
    if (game.status !== 'finished' || game.home_score === null || game.away_score === null) {
      return null;
    }

    const penHome = game.penalty_home_score != null ? Number(game.penalty_home_score) : null;
    const penAway = game.penalty_away_score != null ? Number(game.penalty_away_score) : null;

    // Se tem penalty scores válidos, o vencedor é determinado pelos pênaltis
    if (penHome !== null && penAway !== null) {
      if (penHome === penAway) {
        // Estado inválido — log ERROR e fallback para comportamento sem pênaltis
        this.logger.error(
          `❌ Penalty scores iguais (inválido) | gameId=${game.id} penHome=${penHome} penAway=${penAway}`,
        );
        return this.getRegularTimeResult(game);
      }
      return penHome > penAway ? 'home_win' : 'away_win';
    }

    // Sem pênaltis: comportamento existente
    return this.getRegularTimeResult(game);
  }

  private getRegularTimeResult(game: Game): 'home_win' | 'draw' | 'away_win' | null {
    if (game.home_score === null || game.away_score === null) return null;
    if (game.home_score > game.away_score) return 'home_win';
    if (game.home_score < game.away_score) return 'away_win';
    return 'draw';
  }

  private enrichGameResponse(game: Game): Game & { has_penalties: boolean } {
    return {
      ...game,
      has_penalties:
        game.penalty_home_score !== null && game.penalty_away_score !== null,
    };
  }

  getFinalScoreMultiplier(game: Game): number {
    return game.score_multiplier || 1;
  }
}
