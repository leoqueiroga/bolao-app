import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UUIDValidationPipe } from '../common/pipes/uuid-validation.pipe';
import { BetsService } from './bets.service';
import { AdminCreateBetDto, CreateBetDto, UpdateBetDto } from './dto';

@Controller('bets')
export class BetsController {
  constructor(private betsService: BetsService) {}

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.betsService.findAllByUser(user.id);
  }

  @Get('game/:gameId')
  async findByGame(
    @Param('gameId', UUIDValidationPipe) gameId: string,
    @CurrentUser() user: any,
  ) {
    return this.betsService.findByGame(gameId, user.id);
  }

  @Get('game/:gameId/all')
  async findAllByGame(
    @Param('gameId', UUIDValidationPipe) gameId: string,
    @CurrentUser() user: any,
  ) {
    return this.betsService.findAllByGame(gameId, user);
  }

  @Get(':id')
  async findOne(
    @Param('id', UUIDValidationPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.betsService.findOne(id, user.id);
  }

  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async adminCreate(@Body() adminCreateBetDto: AdminCreateBetDto) {
    return this.betsService.adminCreate(adminCreateBetDto);
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async adminRemove(@Param('id', UUIDValidationPipe) id: string) {
    await this.betsService.adminRemove(id);
    return { message: 'Palpite removido com sucesso' };
  }

  @Post()
  async create(@Body() createBetDto: CreateBetDto, @CurrentUser() user: any) {
    return this.betsService.create(user.id, createBetDto);
  }

  @Put(':id')
  async update(
    @Param('id', UUIDValidationPipe) id: string,
    @Body() updateBetDto: UpdateBetDto,
    @CurrentUser() user: any,
  ) {
    return this.betsService.update(id, user.id, updateBetDto);
  }

  @Delete(':id')
  async remove(
    @Param('id', UUIDValidationPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.betsService.remove(id, user.id);
  }
}
