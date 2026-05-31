import { Module } from '@nestjs/common';
import { ComprasService } from './compras.service';
import { ComprasController } from './compras.controller';
import { CatalogosModule } from '../catalogos/catalogos.module';

@Module({
  imports: [CatalogosModule],
  controllers: [ComprasController],
  providers: [ComprasService],
})
export class ComprasModule { }
