import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
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
import { ReporteIvaDoc } from './docs/reporte-iva.doc';
import { ReporteIvaBodyDto } from './dto/request/reporte-iva-body.dto';
import { ReporteIvaResponseDto } from './dto/response/reporte-iva-response.dto';
import { ReporteInventarioDoc } from './docs/reporte-inventario.doc';
import { ReporteInventarioResponseDto } from './dto/response/reporte-inventario-response.dto';
import { ReporteCuentasPagarDoc } from './docs/reporte-cuentas-pagar.doc';
import { ReporteCuentasPagarResponseDto } from './dto/response/reporte-cuentas-pagar-response.dto';
import type { Response } from 'express';
import { ListIvaDetalleBodyDto } from './dto/request/list-iva-detalle-body.dto';
import { ListIvaComprasResponseDto, ListIvaVentasResponseDto } from './dto/response/list-iva-detalle-response.dto';
import { StockBajoQueryDto } from './dto/request/stock-bajo-body.dto';
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
  async stockBajo(
    @CurrentUser() user: JwtPayload,
    @Query() query: StockBajoQueryDto,
  ): Promise<StockBajoResponseDto> {
    return this.reportesService.getStockBajo(
      user,
      query.umbral,
      query.page,
      query.limit,
    );
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

  @Post('iva-mensual')
  @Auth()
  @ReporteIvaDoc()
  async reporteIva(
    @Body() body: ReporteIvaBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ReporteIvaResponseDto> {
    return this.reportesService.getReporteIva(body, user);
  }

  @Get('inventario-valorado')
  @Auth()
  @ReporteInventarioDoc()
  async reporteInventario(
    @CurrentUser() user: JwtPayload,
  ): Promise<ReporteInventarioResponseDto> {
    return this.reportesService.getInventarioValorado(user);
  }

  @Get('cuentas-por-pagar')
  @Auth()
  @ReporteCuentasPagarDoc()
  async reporteCuentasPagar(
    @CurrentUser() user: JwtPayload,
  ): Promise<ReporteCuentasPagarResponseDto> {
    return this.reportesService.getCuentasPorPagar(user);
  }

  // ── IVA ──────────────────────────────────────────────────────────────
  @Post('iva-mensual/excel')
  @Auth()
  async ivaExcel(
    @Body() body: ReporteIvaBodyDto,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.reportesService.getReporteIvaExcel(body, user);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="iva-${body.mes}-${body.anio}.xlsx"`,
    });
    res.send(buffer);
  }

  @Post('iva-mensual/pdf')
  @Auth()
  async ivaPdf(
    @Body() body: ReporteIvaBodyDto,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.reportesService.getReporteIvaPdf(body, user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="iva-${body.mes}-${body.anio}.pdf"`,
    });
    res.send(buffer);
  }

  // ── Inventario ───────────────────────────────────────────────────────
  @Get('inventario-valorado/excel')
  @Auth()
  async inventarioExcel(
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.reportesService.getInventarioExcel(user);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="inventario-valorado.xlsx"',
    });
    res.send(buffer);
  }

  @Get('inventario-valorado/pdf')
  @Auth()
  async inventarioPdf(
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.reportesService.getInventarioPdf(user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="inventario-valorado.pdf"',
    });
    res.send(buffer);
  }

  // ── Cuentas por pagar ────────────────────────────────────────────────
  @Get('cuentas-por-pagar/excel')
  @Auth()
  async cuentasPagarExcel(
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.reportesService.getCuentasPagarExcel(user);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="cuentas-por-pagar.xlsx"',
    });
    res.send(buffer);
  }

  @Get('cuentas-por-pagar/pdf')
  @Auth()
  async cuentasPagarPdf(
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.reportesService.getCuentasPagarPdf(user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="cuentas-por-pagar.pdf"',
    });
    res.send(buffer);
  }
  @Post('iva-mensual/ventas')
  @Auth()
  async listIvaVentas(
    @Body() body: ListIvaDetalleBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ListIvaVentasResponseDto> {
    return this.reportesService.listIvaVentas(body, user);
  }

  @Post('iva-mensual/compras')
  @Auth()
  async listIvaCompras(
    @Body() body: ListIvaDetalleBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ListIvaComprasResponseDto> {
    return this.reportesService.listIvaCompras(body, user);
  }
}