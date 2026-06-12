import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UUIDValidationPipe } from '../common/pipes/uuid-validation.pipe';
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
  async getUserHistoryById(
    @Param('userId', UUIDValidationPipe) userId: string,
  ) {
    return this.rankingService.getUserHistory(userId);
  }

  @Get('user/:userId/bets')
  async getUserBetsDetails(
    @Param('userId', UUIDValidationPipe) userId: string,
  ) {
    return this.rankingService.getUserBetsDetails(userId);
  }

  @Get('competition/:competitionId')
  async getRankingByCompetition(
    @Param('competitionId', UUIDValidationPipe) competitionId: string,
  ) {
    return this.rankingService.getRankingByCompetition(competitionId);
  }
}
