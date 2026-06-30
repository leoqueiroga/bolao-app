import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private isRunningStatusUpdate = false;
  private isRunningPointsCalculation = false;

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Executa a cada 10 minutos: muda status para in_progress e trava palpites
   */
  @Cron('0 */10 * * * *')
  async handleGameStatusUpdates() {
    if (this.isRunningStatusUpdate) return;
    this.isRunningStatusUpdate = true;
    try {
      const supabase = this.supabaseService.getAdminClient();
      const nowUTC = new Date().toISOString();

      const { data: gamesToStart, error } = await supabase
        .from('games')
        .select('id, home_team, away_team, match_date')
        .eq('status', 'scheduled')
        .lte('match_date', nowUTC)
        .limit(50);

      if (error || !gamesToStart?.length) return;

      const gameIds = gamesToStart.map((g) => g.id);

      await supabase
        .from('games')
        .update({ status: 'in_progress', bets_locked: true, updated_at: new Date().toISOString() })
        .in('id', gameIds);

      this.logger.log(`🔴 ${gamesToStart.length} jogo(s) iniciado(s) — palpites travados`);
    } catch (err) {
      this.logger.error('Erro ao iniciar jogos', err);
    } finally {
      this.isRunningStatusUpdate = false;
    }
  }

  /**
   * Executa a cada 10 minutos com offset de 5min: calcula pontos de jogos finalizados
   */
  @Cron('0 5-55/10 * * * *')
  async handlePointsCalculation() {
    if (this.isRunningPointsCalculation) return;
    this.isRunningPointsCalculation = true;
    try {
      const supabase = this.supabaseService.getAdminClient();

      const { data: finishedGames, error } = await supabase
        .from('games')
        .select('id')
        .is('deleted_at', null)
        .eq('status', 'finished')
        .eq('points_calculated', false)
        .order('match_date', { ascending: true })
        .limit(10);

      if (error || !finishedGames?.length) return;

      for (const game of finishedGames) {
        await this.calculateGamePoints(game.id);
      }
    } catch (err) {
      this.logger.error('Erro ao calcular pontos dos jogos', err);
    } finally {
      this.isRunningPointsCalculation = false;
    }
  }

  async calculateGamePoints(gameId: string, force: boolean = false) {
    this.logger.log(`Calculando pontos para o jogo ${gameId}... (force=${force})`);

    const supabase = this.supabaseService.getAdminClient();

    try {
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError || !game) return { success: false, error: 'Jogo não encontrado' };

      if (game.points_calculated && !force) {
        return { success: true, message: 'Pontos já calculados anteriormente' };
      }

      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*, bet_type:bet_types(*)')
        .eq('game_id', gameId);

      if (betsError) return;

      const finalMultiplier = game.score_multiplier || 1;
      let voidCount = 0;

      for (const bet of bets || []) {
        let points = 0;
        let isCorrect = false;
        let status: 'correct' | 'incorrect' | 'void' = 'incorrect';
        const betType = bet.bet_type?.type;
        const basePoints = bet.bet_type?.default_points || 0;

        if (betType === 'exact_score') {
          if (bet.prediction?.home_score === game.home_score && bet.prediction?.away_score === game.away_score) {
            points = basePoints * finalMultiplier;
            isCorrect = true;
          }
          status = isCorrect ? 'correct' : 'incorrect';
        } else if (betType === 'result') {
          // Apostas de resultado usam o placar do tempo regulamentar (home_score/away_score)
          // Em partidas com pênaltis, o tempo regulamentar é empate — quem apostou empate acertou
          const result = this.getRegularTimeResult(game);
          if (bet.prediction?.result === result) {
            points = basePoints * finalMultiplier;
            isCorrect = true;
          }
          status = isCorrect ? 'correct' : 'incorrect';
        } else if (betType === 'penalty_winner') {
          const penaltyResult = this.evaluatePenaltyWinnerBet(bet, game);
          if (penaltyResult === 'void') {
            status = 'void';
            points = 0;
            voidCount++;
          } else if (penaltyResult === 'correct') {
            status = 'correct';
            points = basePoints * finalMultiplier;
          } else {
            status = 'incorrect';
            points = 0;
          }
        }

        await supabase
          .from('bets')
          .update({ points_earned: points, status })
          .eq('id', bet.id);
      }

      if (voidCount > 0) {
        this.logger.log(`🔇 Apostas penalty_winner marcadas como void | gameId=${gameId} count=${voidCount}`);
      }

      await supabase.from('games').update({ points_calculated: true }).eq('id', gameId);

      this.logger.log(`Pontos calculados para o jogo ${gameId}`);
      await this.updateRanking();

      return { success: true, message: `Pontos calculados para ${bets?.length || 0} apostas` };
    } catch (error) {
      this.logger.error(`Erro ao calcular pontos do jogo ${gameId}:`, error);
      return { success: false, error: error.message };
    }
  }

  private getRegularTimeResult(game: any): 'home_win' | 'draw' | 'away_win' | null {
    if (game.home_score === null || game.away_score === null) return null;
    const homeScore = Number(game.home_score);
    const awayScore = Number(game.away_score);
    if (homeScore > awayScore) return 'home_win';
    if (homeScore < awayScore) return 'away_win';
    return 'draw';
  }

  private evaluatePenaltyWinnerBet(bet: any, game: any): 'correct' | 'incorrect' | 'void' {
    const penHome = game.penalty_home_score != null ? Number(game.penalty_home_score) : null;
    const penAway = game.penalty_away_score != null ? Number(game.penalty_away_score) : null;

    if (penHome === null || penAway === null) {
      return 'void';
    }
    if (penHome === penAway) {
      this.logger.error(
        `❌ Penalty scores iguais (inválido) | gameId=${game.id} penHome=${penHome} penAway=${penAway}`,
      );
      return 'void';
    }
    const winner = penHome > penAway ? 'home_win' : 'away_win';
    return bet.prediction?.result === winner ? 'correct' : 'incorrect';
  }

  async updateRanking() {
    const supabase = this.supabaseService.getAdminClient();

    const { data: userPoints, error } = await supabase
      .from('bets')
      .select('user_id, points_earned')
      .not('points_earned', 'is', null)
      .neq('status', 'void');

    if (error) {
      this.logger.error('Erro ao calcular ranking:', error);
      return;
    }

    const pointsByUser: Record<string, number> = {};
    for (const bet of userPoints || []) {
      pointsByUser[bet.user_id] = (pointsByUser[bet.user_id] || 0) + (bet.points_earned || 0);
    }

    for (const [userId, totalPoints] of Object.entries(pointsByUser)) {
      await supabase.from('profiles').update({ total_points: totalPoints }).eq('id', userId);
    }

    this.logger.log('Ranking atualizado');
  }
}
