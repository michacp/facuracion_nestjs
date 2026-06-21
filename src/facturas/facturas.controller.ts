import { Body, Controller, Post } from '@nestjs/common';
import { FacturasService } from './facturas.service';
import { Auth, CurrentUser } from '../auth/decorators';
import { ListFacturasDoc } from './docs/list-facturas.doc';
import { ListFacturasBodyDto } from './dto/request/list-facturas-body.dto';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ListFacturasResponseDto } from './dto/response/list-facturas-response.dto';
import { SyncFacturaDoc } from './docs/sync-factura.doc';
import { SyncFacturaBodyDto } from './dto/request/sync-factura-body.dto';
import { SyncFacturaResponseDto } from './dto/response/sync-factura-response.dto';
import { RetryFacturaBodyDto } from './dto/request/retry-factura-body.dto';
import { RetryFacturaResponseDto } from './dto/response/retry-factura-response.dto';
import { RetryFacturaDoc } from './docs/retry-factura.doc';

@Controller('facturas')
export class FacturasController {
  constructor(private readonly facturasService: FacturasService) { }

  @Post('list')
  @Auth()
  @ListFacturasDoc()
  async list(
    @Body() body: ListFacturasBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ListFacturasResponseDto> {
    return this.facturasService.listFacturas(body, user);
  }

  @Post('sync')
  @Auth()
  @SyncFacturaDoc()
  async sync(
    @Body() body: SyncFacturaBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SyncFacturaResponseDto> {
    return this.facturasService.syncFactura(body, user);
  }

  @Post('retry')
  @Auth()
  @RetryFacturaDoc()
  async retry(
    @Body() body: RetryFacturaBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<RetryFacturaResponseDto> {
    return this.facturasService.retryFactura(body, user);
  }
}
