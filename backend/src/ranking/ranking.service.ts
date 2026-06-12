import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface RankingEntry {
  user_id: string;
  name: string;
  avatar_url: string | null;
  total_points: number;
  total_bets: number;
  correct_bets: number;
  accuracy: number;
  position: number;
  level: number;
  current_streak: number;
}

@Injectable()
export class RankingService {
  constructor(private supabaseService: SupabaseService) {}

  async getCurrentRanking(): Promise<RankingEntry[]> {
    const supabase = this.supabaseService.getAdminClient();

    // Get all users with their bet statistics
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, level, current_streak')
      .eq('is_active', true);

    if (profilesError) {
      throw new BadRequestException(profilesError.message);
    }

    const ranking: RankingEntry[] = [];

    for (const profile of profiles) {
      // Get bet statistics for each user - incluir todas apostas com status calculado
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('points_earned, status')
        .eq('user_id', profile.id)
        .in('status', ['correct', 'incorrect', 'pending']);

      if (betsError) {
        continue;
      }

      // Considerar apenas apostas com pontos calculados (status correct ou incorrect)
      // ou apostas pending que já tenham points_earned > 0
      const processedBets = bets.filter(
        (bet) =>
          bet.status === 'correct' ||
          bet.status === 'incorrect' ||
          (bet.points_earned && bet.points_earned > 0),
      );

      const totalPoints = bets.reduce(
        (sum, bet) => sum + (bet.points_earned || 0),
        0,
      );
      const totalBets = processedBets.length;
      const correctBets = bets.filter(
        (bet) =>
          bet.status === 'correct' ||
          (bet.points_earned && bet.points_earned > 0),
      ).length;
      const accuracy = totalBets > 0 ? (correctBets / totalBets) * 100 : 0;

      ranking.push({
        user_id: profile.id,
        name: profile.name,
        avatar_url: profile.avatar_url || null,
        total_points: totalPoints,
        total_bets: totalBets,
        correct_bets: correctBets,
        accuracy: Math.round(accuracy * 100) / 100,
        position: 0,
        level: profile.level,
        current_streak: profile.current_streak,
      });
    }

    // Sort by total points descending, with tiebreakers:
    // 1. total_points (desc)
    // 2. correct_bets (desc)
    // 3. accuracy (desc)
    // 4. current_streak (desc)
    // 5. name (asc, alphabetical)
    ranking.sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      if (b.correct_bets !== a.correct_bets) return b.correct_bets - a.correct_bets;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      if (b.current_streak !== a.current_streak) return b.current_streak - a.current_streak;
      return a.name.localeCompare(b.name);
    });

    // Assign positions
    ranking.forEach((entry, index) => {
      entry.position = index + 1;
    });

    return ranking;
  }

  async getUserHistory(userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('ranking_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('snapshot_date', { ascending: false })
      .limit(30);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async getRankingByCompetition(
    competitionId: string,
  ): Promise<RankingEntry[]> {
    const supabase = this.supabaseService.getAdminClient();

    // Get all games for this competition
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id')
      .eq('competition_id', competitionId);

    if (gamesError) {
      throw new BadRequestException(gamesError.message);
    }

    const gameIds = games.map((g) => g.id);

    if (gameIds.length === 0) {
      return [];
    }

    // Get all users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, level, current_streak')
      .eq('is_active', true);

    if (profilesError) {
      throw new BadRequestException(profilesError.message);
    }

    const ranking: RankingEntry[] = [];

    for (const profile of profiles) {
      // Get bet statistics for each user for this competition's games
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('points_earned, status')
        .eq('user_id', profile.id)
        .in('game_id', gameIds)
        .in('status', ['correct', 'incorrect']);

      if (betsError) {
        continue;
      }

      if (bets.length === 0) {
        continue;
      }

      const totalPoints = bets.reduce(
        (sum, bet) => sum + (bet.points_earned || 0),
        0,
      );
      const totalBets = bets.length;
      const correctBets = bets.filter((bet) => bet.status === 'correct').length;
      const accuracy = totalBets > 0 ? (correctBets / totalBets) * 100 : 0;

      ranking.push({
        user_id: profile.id,
        name: profile.name,
        avatar_url: profile.avatar_url || null,
        total_points: totalPoints,
        total_bets: totalBets,
        correct_bets: correctBets,
        accuracy: Math.round(accuracy * 100) / 100,
        position: 0,
        level: profile.level,
        current_streak: profile.current_streak,
      });
    }

    // Sort by total points descending, with tiebreakers:
    // 1. total_points (desc)
    // 2. correct_bets (desc)
    // 3. accuracy (desc)
    // 4. current_streak (desc)
    // 5. name (asc, alphabetical)
    ranking.sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      if (b.correct_bets !== a.correct_bets) return b.correct_bets - a.correct_bets;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      if (b.current_streak !== a.current_streak) return b.current_streak - a.current_streak;
      return a.name.localeCompare(b.name);
    });

    // Assign positions
    ranking.forEach((entry, index) => {
      entry.position = index + 1;
    });

    return ranking;
  }

  async createSnapshot(): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();
    const ranking = await this.getCurrentRanking();
    const now = new Date();

    const snapshots = ranking.map((entry) => ({
      user_id: entry.user_id,
      position: entry.position,
      total_points: entry.total_points,
      total_bets: entry.total_bets,
      correct_bets: entry.correct_bets,
      accuracy: entry.accuracy,
      year: now.getFullYear(),
      snapshot_date: now.toISOString().split('T')[0],
    }));

    const { error } = await supabase
      .from('ranking_snapshots')
      .insert(snapshots);

    if (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Busca os detalhes das apostas de um usuário (de onde vieram os pontos)
   */
  async getUserBetsDetails(userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Buscar todas as apostas do usuário com detalhes do jogo e tipo de aposta
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select(
        `
        id,
        prediction,
        points_earned,
        status,
        created_at,
        bet_type:bet_types(id, name, type, default_points),
        game:games(id, home_team, away_team, match_date, home_score, away_score, status, competition:competitions(name))
      `,
      )
      .eq('user_id', userId)
      .in('status', ['correct', 'incorrect'])
      .order('created_at', { ascending: false });

    if (betsError) {
      throw new BadRequestException(betsError.message);
    }

    // Agrupar por jogo para melhor visualização
    const betsByGame: Record<string, any> = {};

    for (const bet of bets || []) {
      // Supabase retorna objetos, não arrays, para relações 1:1
      const game = bet.game as any;
      const gameId = game?.id;
      if (!gameId) continue;

      if (!betsByGame[gameId]) {
        betsByGame[gameId] = {
          game: {
            ...game,
            competition: game.competition,
          },
          bets: [],
          total_points: 0,
        };
      }

      // Enriquecer prediction com nome do jogador se houver
      const enrichedPrediction = { ...bet.prediction };

      betsByGame[gameId].bets.push({
        id: bet.id,
        bet_type: bet.bet_type,
        prediction: enrichedPrediction,
        points_earned: bet.points_earned || 0,
        status: bet.status,
      });

      betsByGame[gameId].total_points += bet.points_earned || 0;
    }

    // Converter para array e ordenar por data
    const result = Object.values(betsByGame).sort((a: any, b: any) => {
      return (
        new Date(b.game.match_date).getTime() -
        new Date(a.game.match_date).getTime()
      );
    });

    // Calcular totais
    const summary = {
      total_points:
        bets?.reduce((sum, bet) => sum + (bet.points_earned || 0), 0) || 0,
      total_bets: bets?.length || 0,
      correct_bets: bets?.filter((bet) => bet.status === 'correct').length || 0,
      games_with_bets: Object.keys(betsByGame).length,
    };

    return {
      summary,
      games: result,
    };
  }
}
