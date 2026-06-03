import { BadRequestException, Injectable } from '@nestjs/common';
import { RankingService } from '../ranking/ranking.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DashboardService {
  constructor(
    private supabaseService: SupabaseService,
    private rankingService: RankingService,
  ) {}

  async getDashboard(userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new BadRequestException(profileError.message);
    }

    // Get user stats
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('points_earned, status')
      .eq('user_id', userId);

    if (betsError) {
      throw new BadRequestException(betsError.message);
    }

    const totalBets = bets.filter((b) =>
      ['correct', 'incorrect'].includes(b.status),
    ).length;
    const correctBets = bets.filter((b) => b.status === 'correct').length;
    const pendingBets = bets.filter((b) => b.status === 'pending').length;
    const totalPoints = bets.reduce(
      (sum, b) => sum + (b.points_earned || 0),
      0,
    );
    const accuracy =
      totalBets > 0
        ? Math.round((correctBets / totalBets) * 100 * 100) / 100
        : 0;

    // Get upcoming games
    const { data: upcomingGames, error: gamesError } = await supabase
      .from('games')
      .select('*, competition:competitions(*)')
      .is('deleted_at', null)
      .eq('status', 'scheduled')
      .gte('match_date', new Date().toISOString())
      .order('match_date', { ascending: true })
      .limit(5);

    if (gamesError) {
      throw new BadRequestException(gamesError.message);
    }

    // Get user's position in ranking
    const ranking = await this.rankingService.getCurrentRanking();
    const userRanking = ranking.find((r) => r.user_id === userId);

    // Get recent bets
    const { data: recentBets, error: recentBetsError } = await supabase
      .from('bets')
      .select(
        '*, game:games(*, competition:competitions(*)), bet_type:bet_types(*)',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentBetsError) {
      throw new BadRequestException(recentBetsError.message);
    }

    // Get user achievements count — removido (não há achievements neste projeto)

    return {
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        level: profile.level,
        experience_points: profile.experience_points,
        current_streak: profile.current_streak,
        best_streak: profile.best_streak,
      },
      stats: {
        total_points: totalPoints,
        total_bets: totalBets,
        correct_bets: correctBets,
        pending_bets: pendingBets,
        accuracy,
        ranking_position: userRanking?.position || null,
      },
      upcoming_games: upcomingGames,
      recent_bets: recentBets,
    };
  }
}
