import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Bet } from '../common/types';
import { GamesService } from '../games/games.service';
import { SupabaseService } from '../supabase/supabase.service';
import { AdminCreateBetDto, CreateBetDto, UpdateBetDto } from './dto';

@Injectable()
export class BetsService {
  constructor(
    private supabaseService: SupabaseService,
    private gamesService: GamesService,
  ) {}

  async findAllByUser(userId: string): Promise<Bet[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('bets')
      .select('*, game:games(*, competition:competitions(*)), bet_type:bet_types(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async findByGame(gameId: string, userId: string): Promise<Bet[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('bets')
      .select('*, bet_type:bet_types(*)')
      .eq('game_id', gameId)
      .eq('user_id', userId);

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async findAllByGame(gameId: string, user?: any): Promise<Bet[]> {
    const supabase = this.supabaseService.getAdminClient();

    // Verificar se o usuário é admin ou se o jogo já começou
    const game = await this.gamesService.findOne(gameId);
    const isAdmin = user?.role === 'admin';
    const gameHasStarted = game.status !== 'scheduled';

    if (!isAdmin && !gameHasStarted) {
      throw new ForbiddenException(
        'Apostas só ficam visíveis após o início do jogo',
      );
    }

    const { data, error } = await supabase
      .from('bets')
      .select('*, bet_type:bet_types(*), user:profiles(id, name, avatar_url)')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async findOne(id: string, userId: string): Promise<Bet> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('bets')
      .select('*, game:games(*, competition:competitions(*)), bet_type:bet_types(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Bet not found');
    return data;
  }

  async create(userId: string, createBetDto: CreateBetDto): Promise<Bet> {
    const supabase = this.supabaseService.getAdminClient();

    const game = await this.gamesService.findOne(createBetDto.game_id);

    if (!this.gamesService.canAcceptBets(game)) {
      throw new BadRequestException('This game is not accepting bets anymore');
    }

    const { data: existingBet } = await supabase
      .from('bets')
      .select('id')
      .eq('user_id', userId)
      .eq('game_id', createBetDto.game_id)
      .eq('bet_type_id', createBetDto.bet_type_id)
      .single();

    if (existingBet) {
      throw new BadRequestException('You already have a bet of this type for this game');
    }

    const { data, error } = await supabase
      .from('bets')
      .insert({
        user_id: userId,
        game_id: createBetDto.game_id,
        bet_type_id: createBetDto.bet_type_id,
        prediction: createBetDto.prediction,
        status: 'pending',
        points_earned: 0,
      })
      .select('*, game:games(*, competition:competitions(*)), bet_type:bet_types(*)')
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async update(id: string, userId: string, updateBetDto: UpdateBetDto): Promise<Bet> {
    const supabase = this.supabaseService.getAdminClient();

    const bet = await this.findOne(id, userId);
    const game = await this.gamesService.findOne(bet.game_id);

    if (!this.gamesService.canAcceptBets(game) || bet.status !== 'pending') {
      throw new ForbiddenException('This bet cannot be edited');
    }

    const { data, error } = await supabase
      .from('bets')
      .update({ prediction: updateBetDto.prediction, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, game:games(*, competition:competitions(*)), bet_type:bet_types(*)')
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async remove(id: string, userId: string): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();

    const bet = await this.findOne(id, userId);
    const game = await this.gamesService.findOne(bet.game_id);

    if (!this.gamesService.canAcceptBets(game) || bet.status !== 'pending') {
      throw new ForbiddenException('This bet cannot be deleted');
    }

    const { error } = await supabase.from('bets').delete().eq('id', id).eq('user_id', userId);
    if (error) throw new BadRequestException(error.message);
  }

  async adminCreate(adminCreateBetDto: AdminCreateBetDto): Promise<Bet> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', adminCreateBetDto.user_id)
      .single();

    if (!profile) throw new NotFoundException(`Usuário ${adminCreateBetDto.user_id} não encontrado`);

    await this.gamesService.findOne(adminCreateBetDto.game_id);

    const { data: betType } = await supabase
      .from('bet_types')
      .select('id, is_active')
      .eq('id', adminCreateBetDto.bet_type_id)
      .single();

    if (!betType) throw new NotFoundException(`Tipo de palpite ${adminCreateBetDto.bet_type_id} não encontrado`);
    if (!betType.is_active) throw new BadRequestException(`Tipo de palpite ${adminCreateBetDto.bet_type_id} está inativo`);

    const { data, error } = await supabase
      .from('bets')
      .upsert(
        {
          user_id: adminCreateBetDto.user_id,
          game_id: adminCreateBetDto.game_id,
          bet_type_id: adminCreateBetDto.bet_type_id,
          prediction: adminCreateBetDto.prediction,
          status: 'pending',
          points_earned: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,game_id,bet_type_id' },
      )
      .select('*, game:games(*, competition:competitions(*)), bet_type:bet_types(*)')
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async adminRemove(betId: string): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: bet } = await supabase.from('bets').select('id').eq('id', betId).single();
    if (!bet) throw new NotFoundException(`Palpite ${betId} não encontrado`);

    const { error } = await supabase.from('bets').delete().eq('id', betId);
    if (error) throw new BadRequestException(error.message);
  }

  async evaluateBetsForGame(gameId: string): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();

    const game = await this.gamesService.findOne(gameId);
    if (game.status !== 'finished') throw new BadRequestException('Game is not finished yet');

    const { data: bets, error } = await supabase
      .from('bets')
      .select('*, bet_type:bet_types(*)')
      .eq('game_id', gameId)
      .eq('status', 'pending');

    if (error) throw new BadRequestException(error.message);

    const gameResult = this.gamesService.getResult(game);
    const multiplier = this.gamesService.getFinalScoreMultiplier(game);

    for (const bet of bets || []) {
      const isCorrect = this.checkPrediction(bet, game, gameResult);
      let pointsEarned = 0;

      if (isCorrect) {
        const basePoints = await this.getPointsForBet(bet.bet_type_id, gameId, game.competition_id);
        pointsEarned = basePoints * multiplier;
      }

      await supabase
        .from('bets')
        .update({ points_earned: pointsEarned, status: isCorrect ? 'correct' : 'incorrect', updated_at: new Date().toISOString() })
        .eq('id', bet.id);
    }
  }

  private checkPrediction(bet: Bet, game: any, gameResult: string | null): boolean {
    const type = bet.bet_type?.type;
    const prediction = bet.prediction;

    if (type === 'exact_score') {
      return prediction.home_score === game.home_score && prediction.away_score === game.away_score;
    }
    if (type === 'result') {
      return prediction.result === gameResult;
    }
    return false;
  }

  private async getPointsForBet(betTypeId: string, gameId: string, competitionId: string): Promise<number> {
    const supabase = this.supabaseService.getAdminClient();

    let { data: rule } = await supabase
      .from('scoring_rules')
      .select('points')
      .eq('bet_type_id', betTypeId)
      .eq('game_id', gameId)
      .eq('is_active', true)
      .single();

    if (rule) return rule.points;

    ({ data: rule } = await supabase
      .from('scoring_rules')
      .select('points')
      .eq('bet_type_id', betTypeId)
      .eq('competition_id', competitionId)
      .is('game_id', null)
      .eq('is_active', true)
      .single());

    if (rule) return rule.points;

    const { data: betType } = await supabase
      .from('bet_types')
      .select('default_points')
      .eq('id', betTypeId)
      .single();

    return betType?.default_points || 0;
  }
}
