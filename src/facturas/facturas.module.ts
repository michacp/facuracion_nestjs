import { Module } from '@nestjs/common';
import { FacturasService } from './facturas.service';
import { FacturasController } from './facturas.controller';
import { InvoiceNumberHelper } from './helpers/invoice-number.helper';
import { XmlSignerHelper } from './helpers/xml-signer.helper';
import { SriService } from './sri/sri.service';
import { GoogleDriveModule } from '../google-drive/google-drive.module';
import { CatalogosModule } from '../catalogos/catalogos.module';

@Module({

  imports: [GoogleDriveModule, CatalogosModule],
  controllers: [FacturasController],
  providers: [
    FacturasService,
    SriService,
    XmlSignerHelper,
    InvoiceNumberHelper,

  ],
  exports: [FacturasService],
})
export class FacturasModule { }
