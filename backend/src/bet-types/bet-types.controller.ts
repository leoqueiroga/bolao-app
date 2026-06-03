import { Controller, Get, Param } from '@nestjs/common';
import { BetTypesService } from './bet-types.service';

@Controller('bet-types')
export class BetTypesController {
  constructor(private betTypesService: BetTypesService) {}

  @Get()
  async findAll() {
    return this.betTypesService.findActive();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.betTypesService.findOne(id);
  }
}
