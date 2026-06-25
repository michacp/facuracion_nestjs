import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { KpisResponseDto, KpiPeriodoDto } from './dto/response/kpis-response.dto';
import type { VentasSemanasResponseDto } from './dto/response/ventas-semanas-response.dto';
import type { StockBajoResponseDto } from './dto/response/stock-bajo-response.dto';
import type { AlertasResponseDto } from './dto/response/alertas-response.dto';
import type { TopProductosResponseDto } from './dto/response/top-productos-response.dto';
import type { TopClientesResponseDto } from './dto/response/top-clientes-response.dto';
import type { ReporteIvaCompletoDto } from './dto/response/reporte-iva-completo.dto';

import { IvaCompraDetalleDto, IvaTarifaResumenDto, IvaVentaDetalleDto, ReporteIvaResponseDto } from './dto/response/reporte-iva-response.dto';
import { InventarioItemDto, ReporteInventarioResponseDto } from './dto/response/reporte-inventario-response.dto';
import { ProveedorPendienteDto, ReporteCuentasPagarResponseDto } from './dto/response/reporte-cuentas-pagar-response.dto';
import { generarIvaExcel } from './helpers/excel/iva-excel.helper';
import { generarIvaPdf } from './helpers/pdf/iva-pdf.helper';
import { generarInventarioExcel } from './helpers/excel/inventario-excel.helper';
import { generarInventarioPdf } from './helpers/pdf/inventario-pdf.helper';
import { generarCuentasPagarExcel } from './helpers/excel/cuentas-pagar-excel.helper';
import { generarCuentasPagarPdf } from './helpers/pdf/cuentas-pagar-pdf.helper';
import { ListIvaDetalleBodyDto } from './dto/request/list-iva-detalle-body.dto';
import { ReporteIvaBodyDto } from './dto/request/reporte-iva-body.dto';
import { ListIvaComprasResponseDto, ListIvaVentasResponseDto } from './dto/response/list-iva-detalle-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportesService {
    constructor(private readonly prisma: PrismaService) { }

    // ── Helpers de rango de fechas ────────────────────────────────────────
    private getRangos() {
        const ahora = new Date();

        const inicioSemana = new Date(ahora);
        inicioSemana.setDate(ahora.getDate() - ahora.getDay()); // domingo
        inicioSemana.setHours(0, 0, 0, 0);

        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const inicioAnio = new Date(ahora.getFullYear(), 0, 1);

        return { ahora, inicioSemana, inicioMes, inicioAnio };
    }

    private async calcularKpiPeriodo(
        empresaId: number,
        desde: Date,
        hasta: Date,
    ): Promise<KpiPeriodoDto> {
        const [ventasAgg, comprasAgg] = await Promise.all([
            this.prisma.venta.aggregate({
                where: {
                    empresa_id: empresaId,
                    fecha_emision: { gte: desde, lte: hasta },
                },
                _sum: { total: true },
                _count: { venta_id: true },
            }),
            this.prisma.compra.aggregate({
                where: {
                    empresa_id: empresaId,
                    fecha_emision: { gte: desde, lte: hasta },
                },
                _sum: { total_pagar: true },
                _count: { compra_id: true },
            }),
        ]);

        const ventasTotal = Number(ventasAgg._sum.total ?? 0);
        const comprasTotal = Number(comprasAgg._sum.total_pagar ?? 0);

        return {
            ventas_total: ventasTotal,
            ventas_count: ventasAgg._count.venta_id,
            compras_total: comprasTotal,
            compras_count: comprasAgg._count.compra_id,
            utilidad_bruta: parseFloat((ventasTotal - comprasTotal).toFixed(2)),
        };
    }

    // ── GET kpis ──────────────────────────────────────────────────────────
    async getKpis(user: JwtPayload): Promise<KpisResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const { ahora, inicioSemana, inicioMes, inicioAnio } = this.getRangos();

        const [semana, mes, anio] = await Promise.all([
            this.calcularKpiPeriodo(empresaId, inicioSemana, ahora),
            this.calcularKpiPeriodo(empresaId, inicioMes, ahora),
            this.calcularKpiPeriodo(empresaId, inicioAnio, ahora),
        ]);

        return { semana, mes, anio };
    }

    // ── GET ventas-semanas ────────────────────────────────────────────────
    async getVentasSemanas(user: JwtPayload): Promise<VentasSemanasResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const ahora = new Date();

        const semanas: { inicio: Date; fin: Date; idx: number }[] = [];

        for (let i = 3; i >= 0; i--) {
            const finSemana = new Date(ahora);
            finSemana.setDate(ahora.getDate() - (ahora.getDay()) - (i * 7) + 6);
            finSemana.setHours(23, 59, 59, 999);

            const inicioSemana = new Date(finSemana);
            inicioSemana.setDate(finSemana.getDate() - 6);
            inicioSemana.setHours(0, 0, 0, 0);

            semanas.push({ inicio: inicioSemana, fin: finSemana, idx: 4 - i });
        }

        const resultados = await Promise.all(
            semanas.map(async (s) => {
                const [ventasAgg, comprasAgg] = await Promise.all([
                    this.prisma.venta.aggregate({
                        where: {
                            empresa_id: empresaId,
                            fecha_emision: { gte: s.inicio, lte: s.fin },
                        },
                        _sum: { total: true },
                        _count: { venta_id: true },
                    }),
                    this.prisma.compra.aggregate({
                        where: {
                            empresa_id: empresaId,
                            fecha_emision: { gte: s.inicio, lte: s.fin },
                        },
                        _sum: { total_pagar: true },
                        _count: { compra_id: true },
                    }),
                ]);

                return {
                    label: `Sem ${s.idx}`,
                    fecha_inicio: s.inicio.toISOString().split('T')[0],
                    fecha_fin: s.fin.toISOString().split('T')[0],
                    total_ventas: Number(ventasAgg._sum.total ?? 0),
                    count_ventas: ventasAgg._count.venta_id,
                    total_compras: Number(comprasAgg._sum.total_pagar ?? 0),
                    count_compras: comprasAgg._count.compra_id,
                };
            }),
        );

        return { semanas: resultados };
    }

    // ── GET stock-bajo ────────────────────────────────────────────────────
    async getStockBajo(
        user: JwtPayload,
        umbral: number = 5,
    ): Promise<StockBajoResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const lotesAgrupados = await this.prisma.itemLote.groupBy({
            by: ['item_id'],
            where: {
                item: {
                    empresa_id: empresaId,
                    item_activo: true,
                    tipo_item_id: 1,
                },
            },
            _sum: { cantidad: true },
            having: {
                cantidad: { _sum: { lte: umbral } },
            },
        });

        if (lotesAgrupados.length === 0) return { total: 0, items: [] };

        const itemIds = lotesAgrupados.map((l) => l.item_id);

        const items = await this.prisma.item.findMany({
            where: { item_id: { in: itemIds } },
            select: {
                item_id: true,
                item_codigo_principal: true,
                item_nombre: true,
                modelos: {
                    select: {
                        model: {
                            select: { brand: { select: { brands_name: true } } },
                        },
                    },
                },
            },
        });

        const stockMap = new Map(
            lotesAgrupados.map((l) => [l.item_id, Number(l._sum.cantidad ?? 0)]),
        );

        const resultado = items.map((i) => {
            const marcas = i.modelos.length
                ? [...new Set(i.modelos.map((m) => m.model.brand.brands_name))].join(', ')
                : null;

            return {
                item_id: i.item_id,
                codigo: i.item_codigo_principal,
                nombre: i.item_nombre,
                stock_total: stockMap.get(i.item_id) ?? 0,
                umbral,
                modelos: marcas,
            };
        }).sort((a, b) => a.stock_total - b.stock_total);

        return { total: resultado.length, items: resultado };
    }

    // ── GET alertas ───────────────────────────────────────────────────────
    async getAlertas(user: JwtPayload): Promise<AlertasResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const ahora = new Date();
        const en30dias = new Date(ahora);
        en30dias.setDate(ahora.getDate() + 30);

        const [firmas, facturas, compras] = await Promise.all([
            this.prisma.firma.findMany({
                where: {
                    firmas_empresaId: empresaId,
                    firmas_activa: true,
                    firmas_fechaExpiracion: { lte: en30dias },
                },
                select: {
                    firmas_id: true,
                    firmas_alias: true,
                    firmas_fechaExpiracion: true,
                },
            }),

            this.prisma.factura.findMany({
                where: {
                    venta: { empresa_id: empresaId },
                    estadoSri: {
                        codigo: { in: ['PENDIENTE', 'DEVUELTA'] },
                    },
                },
                orderBy: { fecha_envio_sri: 'asc' },
                take: 10,
                select: {
                    factura_id: true,
                    fecha_envio_sri: true,
                    estadoSri: { select: { codigo: true } },
                    venta: { select: { numero_venta: true } },
                },
            }),

            this.prisma.compra.findMany({
                where: {
                    empresa_id: empresaId,
                    estadoPago: { estado_pago_codigo: { in: ['PENDIENTE', 'PARCIAL'] } },
                },
                orderBy: { fecha_emision: 'asc' },
                take: 10,
                select: {
                    compra_id: true,
                    numero_documento: true,
                    total_pagar: true,
                    total_pagado: true,
                    estadoPago: { select: { estado_pago_codigo: true } },
                    proveedor: { select: { razon_social: true } },
                },
            }),
        ]);

        const firmasMapped = firmas.map((f) => {
            const expiracion = new Date(f.firmas_fechaExpiracion!);
            const diasRestantes = Math.ceil(
                (expiracion.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24),
            );
            return {
                firmas_id: f.firmas_id,
                alias: f.firmas_alias ?? 'Sin alias',
                fecha_expiracion: expiracion,
                dias_restantes: diasRestantes,
            };
        });

        const facturasMapped = facturas.map((f) => ({
            factura_id: f.factura_id,
            numero_venta: f.venta.numero_venta,
            estado: f.estadoSri?.codigo ?? '—',
            fecha_envio_sri: f.fecha_envio_sri,
        }));

        const comprasMapped = compras.map((c) => ({
            compra_id: c.compra_id,
            numero_documento: c.numero_documento,
            proveedor: c.proveedor.razon_social,
            saldo_pendiente: parseFloat(
                (Number(c.total_pagar) - Number(c.total_pagado)).toFixed(2),
            ),
            estado_pago: c.estadoPago.estado_pago_codigo,
        }));

        return {
            firmas_por_vencer: firmasMapped,
            facturas_pendientes: facturasMapped,
            compras_por_pagar: comprasMapped,
            total_alertas:
                firmasMapped.length + facturasMapped.length + comprasMapped.length,
        };
    }

    // ── GET top-productos ─────────────────────────────────────────────────
    async getTopProductos(
        user: JwtPayload,
        periodo: 'semana' | 'mes' | 'anio' = 'mes',
    ): Promise<TopProductosResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const { ahora, inicioSemana, inicioMes, inicioAnio } = this.getRangos();
        const desde = periodo === 'semana' ? inicioSemana
            : periodo === 'mes' ? inicioMes
                : inicioAnio;

        const detallesProducto = await this.prisma.detalleVenta.groupBy({
            by: ['lote_id'],
            where: {
                venta: {
                    empresa_id: empresaId,
                    fecha_emision: { gte: desde, lte: ahora },
                },
                lote_id: { not: null },
            },
            _sum: { cantidad: true, precio_unitario: true },
            _count: { detalle_id: true },
        });

        if (detallesProducto.length === 0) {
            return { productos: [], periodo };
        }

        const loteIds = detallesProducto
            .map((d) => d.lote_id)
            .filter((id): id is number => id !== null);

        const lotes = await this.prisma.itemLote.findMany({
            where: { lote_id: { in: loteIds } },
            select: {
                lote_id: true,
                item: {
                    select: {
                        item_id: true,
                        item_codigo_principal: true,
                        item_nombre: true,
                        modelos: {
                            select: {
                                model: {
                                    select: { brand: { select: { brands_name: true } } },
                                },
                            },
                        },
                    },
                },
            },
        });

        const loteMap = new Map(lotes.map((l) => [l.lote_id, l.item]));

        const itemMap = new Map<number, {
            item_id: number; codigo: string; nombre: string;
            unidades: number; total: number; marcas: string | null;
        }>();

        for (const d of detallesProducto) {
            if (!d.lote_id) continue;
            const item = loteMap.get(d.lote_id);
            if (!item) continue;

            const existing = itemMap.get(item.item_id);
            const unidades = Number(d._sum.cantidad ?? 0);
            const facturado = Number(d._sum.precio_unitario ?? 0) * unidades;

            const marcas = item.modelos.length
                ? [...new Set(item.modelos.map((m) => m.model.brand.brands_name))].join(', ')
                : null;

            if (existing) {
                existing.unidades += unidades;
                existing.total += facturado;
            } else {
                itemMap.set(item.item_id, {
                    item_id: item.item_id,
                    codigo: item.item_codigo_principal,
                    nombre: item.item_nombre,
                    unidades,
                    total: facturado,
                    marcas,
                });
            }
        }

        const productos = [...itemMap.values()]
            .sort((a, b) => b.unidades - a.unidades)
            .slice(0, 5)
            .map((i) => ({
                item_id: i.item_id,
                codigo: i.codigo,
                nombre: i.nombre,
                unidades_vendidas: i.unidades,
                total_facturado: parseFloat(i.total.toFixed(2)),
                marcas: i.marcas,
            }));

        return { productos, periodo };
    }

    // ── GET top-clientes ──────────────────────────────────────────────────
    async getTopClientes(
        user: JwtPayload,
        periodo: 'semana' | 'mes' | 'anio' = 'mes',
    ): Promise<TopClientesResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const { ahora, inicioSemana, inicioMes, inicioAnio } = this.getRangos();
        const desde = periodo === 'semana' ? inicioSemana
            : periodo === 'mes' ? inicioMes
                : inicioAnio;

        const ventasAgrupadas = await this.prisma.venta.groupBy({
            by: ['cliente_id'],
            where: {
                empresa_id: empresaId,
                fecha_emision: { gte: desde, lte: ahora },
            },
            _sum: { total: true },
            _count: { venta_id: true },
            orderBy: { _sum: { total: 'desc' } },
            take: 5,
        });

        if (ventasAgrupadas.length === 0) return { clientes: [], periodo };

        const clienteIds = ventasAgrupadas.map((v) => v.cliente_id);
        const clientes = await this.prisma.cliente.findMany({
            where: { id: { in: clienteIds } },
            select: { id: true, razon_social: true, identificacion: true },
        });

        const clienteMap = new Map(clientes.map((c) => [c.id, c]));

        const resultado = ventasAgrupadas.map((v) => {
            const cliente = clienteMap.get(v.cliente_id);
            return {
                cliente_id: v.cliente_id,
                razon_social: cliente?.razon_social ?? '—',
                identificacion: cliente?.identificacion ?? '—',
                total_compras: v._count.venta_id,
                total_facturado: parseFloat(Number(v._sum.total ?? 0).toFixed(2)),
            };
        });

        return { clientes: resultado, periodo };
    }

    // ── REPORTE INVENTARIO VALORADO (CPP) ─────────────────────────────────
    async getInventarioValorado(
        user: JwtPayload,
    ): Promise<ReporteInventarioResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const items = await this.prisma.item.findMany({
            where: {
                empresa_id: empresaId,
                item_activo: true,
                tipo_item_id: 1,
                lotes: { some: { cantidad: { gt: 0 } } },
            },
            select: {
                item_id: true,
                item_codigo_principal: true,
                item_nombre: true,
                lotes: {
                    where: { cantidad: { gt: 0 } },
                    select: {
                        lote_id: true,
                        numero_lote: true,
                        cantidad: true,
                        detallesCompra: {
                            select: { costo_unitario: true },
                            take: 1,
                            orderBy: { detalle_id: 'asc' },
                        },
                    },
                },
            },
        });

        const itemsResult: InventarioItemDto[] = items.map((i) => {
            const lotesDetalle = i.lotes.map((l) => {
                const costoOrigen = Number(l.detallesCompra[0]?.costo_unitario ?? 0);
                return {
                    lote_id: l.lote_id,
                    numero_lote: l.numero_lote,
                    cantidad: l.cantidad,
                    costo_origen: costoOrigen,
                    valor_lote: parseFloat((l.cantidad * costoOrigen).toFixed(2)),
                };
            });

            const stockTotal = lotesDetalle.reduce((a, l) => a + l.cantidad, 0);
            const valorTotal = lotesDetalle.reduce((a, l) => a + l.valor_lote, 0);

            const costoPromedio = stockTotal > 0
                ? parseFloat((valorTotal / stockTotal).toFixed(4))
                : 0;

            return {
                item_id: i.item_id,
                codigo: i.item_codigo_principal,
                nombre: i.item_nombre,
                stock_total: stockTotal,
                costo_promedio: costoPromedio,
                valor_total: parseFloat(valorTotal.toFixed(2)),
                lotes: lotesDetalle,
            };
        });

        const valorTotalInventario = parseFloat(
            itemsResult.reduce((a, i) => a + i.valor_total, 0).toFixed(2),
        );

        return {
            fecha_corte: new Date(),
            total_items: itemsResult.length,
            valor_total_inventario: valorTotalInventario,
            items: itemsResult,
        };
    }

    // ── REPORTE CUENTAS POR PAGAR ──────────────────────────────────────────
    async getCuentasPorPagar(
        user: JwtPayload,
    ): Promise<ReporteCuentasPagarResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const compras = await this.prisma.compra.findMany({
            where: {
                empresa_id: empresaId,
                estadoPago: { estado_pago_codigo: { in: ['PENDIENTE', 'PARCIAL'] } },
            },
            orderBy: { fecha_emision: 'asc' },
            select: {
                compra_id: true,
                numero_documento: true,
                fecha_emision: true,
                total_pagar: true,
                total_pagado: true,
                estadoPago: { select: { estado_pago_codigo: true } },
                proveedor: {
                    select: {
                        proveedor_id: true,
                        razon_social: true,
                        identificacion: true,
                    },
                },
            },
        });

        const ahora = new Date();

        const proveedorMap = new Map<number, ProveedorPendienteDto>();

        for (const c of compras) {
            const saldo = parseFloat(
                (Number(c.total_pagar) - Number(c.total_pagado)).toFixed(2),
            );
            if (saldo <= 0) continue;

            const diasAntiguedad = Math.floor(
                (ahora.getTime() - new Date(c.fecha_emision).getTime()) / (1000 * 60 * 60 * 24),
            );

            const compraItem = {
                compra_id: c.compra_id,
                numero_documento: c.numero_documento,
                fecha_emision: c.fecha_emision,
                total_pagar: Number(c.total_pagar),
                total_pagado: Number(c.total_pagado),
                saldo_pendiente: saldo,
                estado_pago: c.estadoPago.estado_pago_codigo,
                dias_antiguedad: diasAntiguedad,
            };

            const existing = proveedorMap.get(c.proveedor.proveedor_id);
            if (existing) {
                existing.saldo_total += saldo;
                existing.compras.push(compraItem);
            } else {
                proveedorMap.set(c.proveedor.proveedor_id, {
                    proveedor_id: c.proveedor.proveedor_id,
                    razon_social: c.proveedor.razon_social,
                    identificacion: c.proveedor.identificacion,
                    saldo_total: saldo,
                    compras: [compraItem],
                });
            }
        }

        const proveedores = [...proveedorMap.values()].map((p) => ({
            ...p,
            saldo_total: parseFloat(p.saldo_total.toFixed(2)),
        }));

        const totalPorPagar = parseFloat(
            proveedores.reduce((a, p) => a + p.saldo_total, 0).toFixed(2),
        );

        return {
            fecha_corte: ahora,
            total_por_pagar: totalPorPagar,
            total_proveedores: proveedores.length,
            proveedores,
        };
    }

    // ── Helper privado: rango de fechas del mes ────────────────────────────
    private getRangoMes(mes: number, anio: number) {
        const desde = new Date(anio, mes - 1, 1);
        const hasta = new Date(anio, mes, 0, 23, 59, 59, 999);
        return { desde, hasta };
    }

    // ── RESUMEN IVA (liviano — sin arrays de detalle, para pantalla) ───────
    async getReporteIva(
        dto: ReporteIvaBodyDto,
        user: JwtPayload,
    ): Promise<ReporteIvaResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const { desde, hasta } = this.getRangoMes(dto.mes, dto.anio);

        const ventasAgrupadas = await this.prisma.detalleVenta.groupBy({
            by: ['tarifa_impuesto_id'],
            where: { venta: { empresa_id: empresaId, fecha_emision: { gte: desde, lte: hasta } } },
            _sum: { cantidad: true, precio_unitario: true, descuento: true },
            _count: { detalle_id: true },
        });

        const tarifas = await this.prisma.tarifaImpuesto.findMany({
            where: { tarifa_impuesto_id: { in: ventasAgrupadas.map((v) => v.tarifa_impuesto_id) } },
            select: { tarifa_impuesto_id: true, tarifa_porcentaje: true },
        });
        const tarifaMap = new Map(tarifas.map((t) => [t.tarifa_impuesto_id, Number(t.tarifa_porcentaje)]));

        const resumen_ventas: IvaTarifaResumenDto[] = ventasAgrupadas.map((v) => {
            const tarifa = tarifaMap.get(v.tarifa_impuesto_id) ?? 0;
            const base = Number(v._sum.precio_unitario ?? 0) - Number(v._sum.descuento ?? 0);
            return {
                tarifa_porcentaje: tarifa,
                base_imponible: parseFloat(base.toFixed(2)),
                iva: parseFloat((base * tarifa / 100).toFixed(2)),
                cantidad_registros: v._count.detalle_id,
            };
        });

        const comprasAgrupadas = await this.prisma.compra.groupBy({
            by: ['porcentaje_impuesto'],
            where: { empresa_id: empresaId, fecha_emision: { gte: desde, lte: hasta } },
            _sum: { subtotal: true, descuento_global: true, valor_impuesto: true },
            _count: { compra_id: true },
        });

        const resumen_compras: IvaTarifaResumenDto[] = comprasAgrupadas.map((c) => ({
            tarifa_porcentaje: Number(c.porcentaje_impuesto),
            base_imponible: parseFloat((Number(c._sum.subtotal ?? 0) - Number(c._sum.descuento_global ?? 0)).toFixed(2)),
            iva: Number(c._sum.valor_impuesto ?? 0),
            cantidad_registros: c._count.compra_id,
        }));

        const ivaTotalVentas = parseFloat(resumen_ventas.reduce((a, r) => a + r.iva, 0).toFixed(2));
        const ivaTotalCompras = parseFloat(resumen_compras.reduce((a, r) => a + r.iva, 0).toFixed(2));

        return {
            mes: dto.mes, anio: dto.anio,
            resumen_ventas, resumen_compras,
            iva_total_ventas: ivaTotalVentas,
            iva_total_compras: ivaTotalCompras,
            iva_a_pagar: parseFloat((ivaTotalVentas - ivaTotalCompras).toFixed(2)),
        };
    }

    // ── REPORTE IVA COMPLETO (sin paginar — SOLO para Excel/PDF) ───────────
    private async getReporteIvaCompleto(
        dto: ReporteIvaBodyDto,
        user: JwtPayload,
    ): Promise<ReporteIvaCompletoDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const { desde, hasta } = this.getRangoMes(dto.mes, dto.anio);

        // ── Resumen (reusa la misma lógica agrupada) ────────────────────────
        const resumen = await this.getReporteIva(dto, user);

        // ── Detalle COMPLETO de ventas (todas las filas, sin take/skip) ─────
        const detallesVentaRaw = await this.prisma.detalleVenta.findMany({
            where: {
                venta: { empresa_id: empresaId, fecha_emision: { gte: desde, lte: hasta } },
            },
            orderBy: { venta: { fecha_emision: 'desc' } },
            select: {
                venta_id: true, cantidad: true, precio_unitario: true, descuento: true,
                tarifaImpuesto: { select: { tarifa_porcentaje: true } },
                venta: {
                    select: {
                        numero_venta: true, fecha_emision: true,
                        cliente: { select: { razon_social: true, identificacion: true } },
                    },
                },
                lote: { select: { item: { select: { item_nombre: true } } } },
                item: { select: { item_nombre: true } },
            },
        });

        const detalle_ventas: IvaVentaDetalleDto[] = detallesVentaRaw.map((d) => {
            const base = Number(d.cantidad) * Number(d.precio_unitario) - Number(d.descuento);
            const tarifa = Number(d.tarifaImpuesto.tarifa_porcentaje);
            return {
                venta_id: d.venta_id,
                numero_venta: d.venta.numero_venta,
                fecha_emision: d.venta.fecha_emision,
                cliente: d.venta.cliente.razon_social,
                identificacion: d.venta.cliente.identificacion,
                item_nombre: d.lote?.item.item_nombre ?? d.item?.item_nombre ?? '—',
                cantidad: d.cantidad,
                precio_unitario: Number(d.precio_unitario),
                descuento: Number(d.descuento),
                base_imponible: parseFloat(base.toFixed(2)),
                tarifa_porcentaje: tarifa,
                iva_calculado: parseFloat((base * tarifa / 100).toFixed(2)),
            };
        });

        // ── Detalle COMPLETO de compras (todas las filas, sin take/skip) ────
        const comprasRaw = await this.prisma.compra.findMany({
            where: { empresa_id: empresaId, fecha_emision: { gte: desde, lte: hasta } },
            orderBy: { fecha_emision: 'desc' },
            select: {
                compra_id: true, numero_documento: true, fecha_emision: true,
                subtotal: true, descuento_global: true, porcentaje_impuesto: true, valor_impuesto: true,
                proveedor: { select: { razon_social: true, identificacion: true } },
            },
        });

        const detalle_compras: IvaCompraDetalleDto[] = comprasRaw.map((c) => ({
            compra_id: c.compra_id,
            numero_documento: c.numero_documento,
            fecha_emision: c.fecha_emision,
            proveedor: c.proveedor.razon_social,
            proveedor_identificacion: c.proveedor.identificacion,
            base_imponible: parseFloat((Number(c.subtotal) - Number(c.descuento_global)).toFixed(2)),
            tarifa_porcentaje: Number(c.porcentaje_impuesto),
            iva: Number(c.valor_impuesto),
        }));

        return {
            ...resumen,
            detalle_ventas,
            detalle_compras,
        };
    }

    // ── DETALLE VENTAS — PAGINADO (para pantalla) ──────────────────────────
    async listIvaVentas(
        dto: ListIvaDetalleBodyDto,
        user: JwtPayload,
    ): Promise<ListIvaVentasResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const { desde, hasta } = this.getRangoMes(dto.mes, dto.anio);
        const { search, page = 0, limit = 30 } = dto;

        const where: Prisma.DetalleVentaWhereInput = {
            venta: {
                empresa_id: empresaId,
                fecha_emision: { gte: desde, lte: hasta },
                ...(search?.trim() && {
                    OR: [
                        { numero_venta: { contains: search.trim(), mode: 'insensitive' } },
                        { cliente: { razon_social: { contains: search.trim(), mode: 'insensitive' } } },
                    ],
                }),
            },
        };

        const [total, rows] = await Promise.all([
            this.prisma.detalleVenta.count({ where }),
            this.prisma.detalleVenta.findMany({
                where,
                skip: page * limit,
                take: limit,
                orderBy: { venta: { fecha_emision: 'desc' } },
                select: {
                    venta_id: true, cantidad: true, precio_unitario: true, descuento: true,
                    tarifaImpuesto: { select: { tarifa_porcentaje: true } },
                    venta: {
                        select: {
                            numero_venta: true, fecha_emision: true,
                            cliente: { select: { razon_social: true, identificacion: true } },
                        },
                    },
                    lote: { select: { item: { select: { item_nombre: true } } } },
                    item: { select: { item_nombre: true } },
                },
            }),
        ]);

        const detalle: IvaVentaDetalleDto[] = rows.map((d) => {
            const base = Number(d.cantidad) * Number(d.precio_unitario) - Number(d.descuento);
            const tarifa = Number(d.tarifaImpuesto.tarifa_porcentaje);
            return {
                venta_id: d.venta_id,
                numero_venta: d.venta.numero_venta,
                fecha_emision: d.venta.fecha_emision,
                cliente: d.venta.cliente.razon_social,
                identificacion: d.venta.cliente.identificacion,
                item_nombre: d.lote?.item.item_nombre ?? d.item?.item_nombre ?? '—',
                cantidad: d.cantidad,
                precio_unitario: Number(d.precio_unitario),
                descuento: Number(d.descuento),
                base_imponible: parseFloat(base.toFixed(2)),
                tarifa_porcentaje: tarifa,
                iva_calculado: parseFloat((base * tarifa / 100).toFixed(2)),
            };
        });

        return { total, detalle };
    }

    // ── DETALLE COMPRAS — PAGINADO (para pantalla) ─────────────────────────
    async listIvaCompras(
        dto: ListIvaDetalleBodyDto,
        user: JwtPayload,
    ): Promise<ListIvaComprasResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const { desde, hasta } = this.getRangoMes(dto.mes, dto.anio);
        const { search, page = 0, limit = 30 } = dto;

        const where: Prisma.CompraWhereInput = {
            empresa_id: empresaId,
            fecha_emision: { gte: desde, lte: hasta },
            ...(search?.trim() && {
                OR: [
                    { numero_documento: { contains: search.trim(), mode: 'insensitive' } },
                    { proveedor: { razon_social: { contains: search.trim(), mode: 'insensitive' } } },
                ],
            }),
        };

        const [total, rows] = await Promise.all([
            this.prisma.compra.count({ where }),
            this.prisma.compra.findMany({
                where, skip: page * limit, take: limit,
                orderBy: { fecha_emision: 'desc' },
                select: {
                    compra_id: true, numero_documento: true, fecha_emision: true,
                    subtotal: true, descuento_global: true, porcentaje_impuesto: true, valor_impuesto: true,
                    proveedor: { select: { razon_social: true, identificacion: true } },
                },
            }),
        ]);

        const detalle: IvaCompraDetalleDto[] = rows.map((c) => ({
            compra_id: c.compra_id,
            numero_documento: c.numero_documento,
            fecha_emision: c.fecha_emision,
            proveedor: c.proveedor.razon_social,
            proveedor_identificacion: c.proveedor.identificacion,
            base_imponible: parseFloat((Number(c.subtotal) - Number(c.descuento_global)).toFixed(2)),
            tarifa_porcentaje: Number(c.porcentaje_impuesto),
            iva: Number(c.valor_impuesto),
        }));

        return { total, detalle };
    }

    // ── IVA — Excel / PDF (usan el dataset COMPLETO, sin paginar) ──────────
    async getReporteIvaExcel(dto: ReporteIvaBodyDto, user: JwtPayload): Promise<Buffer> {
        const data = await this.getReporteIvaCompleto(dto, user);
        return generarIvaExcel(data);
    }

    async getReporteIvaPdf(dto: ReporteIvaBodyDto, user: JwtPayload): Promise<Buffer> {
        const data = await this.getReporteIvaCompleto(dto, user);
        return generarIvaPdf(data);
    }

    // ── Inventario — Excel / PDF ────────────────────────────────────────────
    async getInventarioExcel(user: JwtPayload): Promise<Buffer> {
        const data = await this.getInventarioValorado(user);
        return generarInventarioExcel(data);
    }

    async getInventarioPdf(user: JwtPayload): Promise<Buffer> {
        const data = await this.getInventarioValorado(user);
        return generarInventarioPdf(data);
    }

    // ── Cuentas por pagar — Excel / PDF ──────────────────────────────────
    async getCuentasPagarExcel(user: JwtPayload): Promise<Buffer> {
        const data = await this.getCuentasPorPagar(user);
        return generarCuentasPagarExcel(data);
    }

    async getCuentasPagarPdf(user: JwtPayload): Promise<Buffer> {
        const data = await this.getCuentasPorPagar(user);
        return generarCuentasPagarPdf(data);
    }
}