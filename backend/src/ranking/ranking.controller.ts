import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RankingService } from './ranking.service';

@Controller('ranking')
export class RankingController {
  constructor(private rankingService: RankingService) {}

  @Get('current')
  async getCurrentRanking() {
    return this.rankingService.getCurrentRanking();
  }

  @Get('history')
  async getUserHistory(@CurrentUser() user: any) {
    return this.rankingService.getUserHistory(user.id);
  }

  @Get('user/:userId')
  async getUserHistoryById(@Param('userId') userId: string) {
    return this.rankingService.getUserHistory(userId);
  }

  @Get('user/:userId/bets')
  async getUserBetsDetails(@Param('userId') userId: string) {
    return this.rankingService.getUserBetsDetails(userId);
  }

  @Get('competition/:competitionId')
  async getRankingByCompetition(@Param('competitionId') competitionId: string) {
    return this.rankingService.getRankingByCompetition(competitionId);
  }
}
