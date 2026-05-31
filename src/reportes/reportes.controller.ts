import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import { Auth, CurrentUser } from '../auth/decorators';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { KpisResponseDto } from './dto/response/kpis-response.dto';
import type { VentasSemanasResponseDto } from './dto/response/ventas-semanas-response.dto';
import type { StockBajoResponseDto } from './dto/response/stock-bajo-response.dto';
import type { AlertasResponseDto } from './dto/response/alertas-response.dto';
import type { TopProductosResponseDto } from './dto/response/top-productos-response.dto';
import type { TopClientesResponseDto } from './dto/response/top-clientes-response.dto';

@ApiTags('Reportes / Dashboard')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) { }

  @Get('kpis')
  @Auth()
  async kpis(@CurrentUser() user: JwtPayload): Promise<KpisResponseDto> {
    return this.reportesService.getKpis(user);
  }

  @Get('ventas-semanas')
  @Auth()
  async ventasSemanas(
    @CurrentUser() user: JwtPayload,
  ): Promise<VentasSemanasResponseDto> {
    return this.reportesService.getVentasSemanas(user);
  }

  @Get('stock-bajo')
  @Auth()
  @ApiQuery({ name: 'umbral', required: false, example: 5 })
  async stockBajo(
    @CurrentUser() user: JwtPayload,
    @Query('umbral') umbral?: string,
  ): Promise<StockBajoResponseDto> {
    return this.reportesService.getStockBajo(user, umbral ? Number(umbral) : 5);
  }

  @Get('alertas')
  @Auth()
  async alertas(@CurrentUser() user: JwtPayload): Promise<AlertasResponseDto> {
    return this.reportesService.getAlertas(user);
  }

  @Get('top-productos')
  @Auth()
  @ApiQuery({ name: 'periodo', required: false, enum: ['semana', 'mes', 'anio'] })
  async topProductos(
    @CurrentUser() user: JwtPayload,
    @Query('periodo') periodo?: string,
  ): Promise<TopProductosResponseDto> {
    const p = ['semana', 'mes', 'anio'].includes(periodo ?? '')
      ? (periodo as 'semana' | 'mes' | 'anio')
      : 'mes';
    return this.reportesService.getTopProductos(user, p);
  }

  @Get('top-clientes')
  @Auth()
  @ApiQuery({ name: 'periodo', required: false, enum: ['semana', 'mes', 'anio'] })
  async topClientes(
    @CurrentUser() user: JwtPayload,
    @Query('periodo') periodo?: string,
  ): Promise<TopClientesResponseDto> {
    const p = ['semana', 'mes', 'anio'].includes(periodo ?? '')
      ? (periodo as 'semana' | 'mes' | 'anio')
      : 'mes';
    return this.reportesService.getTopClientes(user, p);
  }
}