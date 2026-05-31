import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GoogleDriveModule } from './google-drive/google-drive.module';
import { BootstrapService } from './bootstrap.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ItemsModule } from './items/items.module';
import { GsmArenaModule } from './gsm-arena/gsm-arena.module';
import { CatalogosModule } from './catalogos/catalogos.module';
import { ClientesModule } from './clientes/clientes.module';
import { VentasModule } from './ventas/ventas.module';
import { AppMulterModule } from './multer/multer.module';
import { FirmasModule } from './firmas/firmas.module';
import { PdfModule } from './pdf/pdf.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { ComprasModule } from './compras/compras.module';
import { ReportesModule } from './reportes/reportes.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,          // ← Esto hace que ConfigService esté disponible EN TODOS los módulos sin tener que importarlo manualmente
    envFilePath: '.env',     // o ['.env.local', '.env'] si usas varios
    // cache: true,          // opcional, mejora performance
  }), GoogleDriveModule, PrismaModule, AuthModule, ItemsModule,
    GsmArenaModule, CatalogosModule, ClientesModule,
    VentasModule, AppMulterModule, FirmasModule, PdfModule, ProveedoresModule, ComprasModule, ReportesModule],
  controllers: [AppController],
  providers: [AppService, BootstrapService],
})
export class AppModule { }
