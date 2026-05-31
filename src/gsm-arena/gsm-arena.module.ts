import { Module } from '@nestjs/common';
import { GsmArenaService } from './gsm-arena.service';

@Module({
  providers: [GsmArenaService]

})
export class GsmArenaModule { }
