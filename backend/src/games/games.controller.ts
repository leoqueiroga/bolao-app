import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UUIDValidationPipe } from '../common/pipes/uuid-validation.pipe';
import { SchedulerService } from '../scheduler/scheduler.service';
import { CreateGameDto, UpdateGameDto } from './dto';
import { GamesService } from './games.service';

class FindGamesQueryDto {
  @IsUUID()
  @IsOptional()
  competition_id?: string;

  @IsEnum(['scheduled', 'in_progress', 'finished', 'postponed', 'cancelled'])
  @IsOptional()
  status?: string;
}

@Controller('games')
export class GamesController {
  constructor(
    private gamesService: GamesService,
    private schedulerService: SchedulerService,
  ) {}

  @Get()
  async findAll(@Query() query: FindGamesQueryDto) {
    return this.gamesService.findAll({
      competition_id: query.competition_id,
      status: query.status,
    });
  }

  @Get('upcoming')
  async findUpcoming() {
    return this.gamesService.findUpcoming();
  }

  @Get(':id')
  async findOne(@Param('id', UUIDValidationPipe) id: string) {
    return this.gamesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async create(@Body() createGameDto: CreateGameDto) {
    return this.gamesService.create(createGameDto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(
    @Param('id', UUIDValidationPipe) id: string,
    @Body() updateGameDto: UpdateGameDto,
  ) {
    return this.gamesService.update(id, updateGameDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async remove(@Param('id', UUIDValidationPipe) id: string) {
    return this.gamesService.remove(id);
  }

  @Post(':id/recalculate-points')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async recalculatePoints(@Param('id', UUIDValidationPipe) gameId: string) {
    return this.schedulerService.calculateGamePoints(gameId, true);
  }

  @Post(':id/temporary-unlock')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async temporaryUnlock(@Param('id', UUIDValidationPipe) gameId: string) {
    const game = await this.gamesService.temporaryUnlock(gameId);
    return {
      message: 'Palpites liberados temporariamente por 10 minutos',
      bets_unlock_until: game.bets_unlock_until,
    };
  }
}
