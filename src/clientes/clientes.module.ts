import { Module } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { CatalogosModule } from '../catalogos/catalogos.module';

@Module({
  imports: [CatalogosModule],
  controllers: [ClientesController],
  providers: [ClientesService],
})
export class ClientesModule { }
