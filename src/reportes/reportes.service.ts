import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { KpisResponseDto, KpiPeriodoDto } from './dto/response/kpis-response.dto';
import type { VentasSemanasResponseDto } from './dto/response/ventas-semanas-response.dto';
import type { StockBajoResponseDto } from './dto/response/stock-bajo-response.dto';
import type { AlertasResponseDto } from './dto/response/alertas-response.dto';
import type { TopProductosResponseDto } from './dto/response/top-productos-response.dto';
import type { TopClientesResponseDto } from './dto/response/top-clientes-response.dto';

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

        // 👇 SOLUCIÓN: Definimos explícitamente el tipo de datos que aceptará el arreglo
        const semanas: { inicio: Date; fin: Date; idx: number }[] = [];

        // Construir las 4 semanas hacia atrás
        for (let i = 3; i >= 0; i--) {
            const finSemana = new Date(ahora);
            finSemana.setDate(ahora.getDate() - (ahora.getDay()) - (i * 7) + 6);
            finSemana.setHours(23, 59, 59, 999);

            const inicioSemana = new Date(finSemana);
            inicioSemana.setDate(finSemana.getDate() - 6);
            inicioSemana.setHours(0, 0, 0, 0);

            // Ahora TypeScript ya sabe que este objeto es totalmente válido aquí 🎉
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

        // Agrupar stock por item
        const lotesAgrupados = await this.prisma.itemLote.groupBy({
            by: ['item_id'],
            where: {
                item: {
                    empresa_id: empresaId,
                    item_activo: true,
                    tipo_item_id: 1, // solo productos físicos
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

            // Firmas por vencer en 30 días
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

            // Facturas PENDIENTE o DEVUELTA
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

            // Compras con saldo pendiente
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

        // Agrupar detalles de venta por item (via lote para productos)
        const detallesProducto = await this.prisma.detalleVenta.groupBy({
            by: ['lote_id'],
            where: {
                venta: {
                    empresa_id: empresaId,
                    fecha_emision: { gte: desde, lte: ahora },
                },
                lote_id: { not: null }, // solo productos, no servicios
            },
            _sum: { cantidad: true, precio_unitario: true },
            _count: { detalle_id: true },
        });

        if (detallesProducto.length === 0) {
            return { productos: [], periodo };
        }

        // Obtener items desde los lotes
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

        // Agrupar por item_id (puede haber varios lotes del mismo item)
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
}