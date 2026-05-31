import { Module } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { VentasController } from './ventas.controller';
import { CatalogosModule } from '../catalogos/catalogos.module';
import { ItemsModule } from '../items/items.module';
import { FacturasModule } from '../facturas/facturas.module';

@Module({
  imports: [ItemsModule, CatalogosModule, FacturasModule],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule { }
