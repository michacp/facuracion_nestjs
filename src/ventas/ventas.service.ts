import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { GetNewDataSalesResponseDto } from './dto/response/get-new-data-sales-response.dto';
import { ItemsService } from '../items/items.service';
import { CatalogosService } from '../catalogos/catalogos.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { SaveSaleBodyDto } from './dto/request/save-sale-body.dto';
import { SaveSaleResponseDto } from './dto/response/save-sale-response.dto';
import { Get5LastSalesResponseDto } from './dto/response/get5-last-sales-response.dto';
import { ListSalesResponseDto, SaleListItemDetailDto, SaleListItemDto } from './dto/response/list-sales-response.dto';
import { ListSalesBodyDto } from './dto/request/list-sales-body.dto';
import { Prisma } from '@prisma/client';
import { FacturasService } from '../facturas/facturas.service';

@Injectable()
export class VentasService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly catalogosService: CatalogosService,
        private readonly itemsService: ItemsService,    // ← findProductsIdName ya migrado
        private readonly facturasService: FacturasService,
    ) { }

    // ── GET /sales/getnewdata ────────────────────────────────────────────
    async getNewData(user: JwtPayload): Promise<GetNewDataSalesResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException('Sin empresa asignada en el token');

        // Todo en paralelo — mismo patrón que el legacy Promise.all
        const [impuestos, vouchertype, formapago] = await Promise.all([
            // this.itemsService.findProductsIdName({ search: undefined }, user), // sin filtro = últimos 50
            this.catalogosService.findTaxes(),
            this.catalogosService.findVoucherType(),
            this.catalogosService.findPayType(),
        ]);

        return { impuestos, vouchertype, formapago };
    }

    // ── POST save ────────────────────────────────────────────────────────
    async save(dto: SaveSaleBodyDto, user: JwtPayload): Promise<SaveSaleResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException('Sin empresa asignada en el token');

        if (!dto.productos.length) {
            throw new BadRequestException('No se puede guardar la venta sin productos.');
        }

        // ── 1. Tipo de comprobante ───────────────────────────────────────────
        const tipoComprobante = await this.prisma.tipoComprobante.findUnique({
            where: { tipo_comprobante_id: dto.tipoComprobante },
            select: { abreviatura: true },
        });

        if (!tipoComprobante) {
            throw new NotFoundException(
                `Tipo de comprobante con ID ${dto.tipoComprobante} no encontrado`,
            );
        }

        // ── 2. Número de venta ───────────────────────────────────────────────
        const { abreviatura } = tipoComprobante;

        const lastVenta = await this.prisma.venta.findFirst({
            where: {
                empresa_id: empresaId,
                tipo_comprobante_id: dto.tipoComprobante,
                numero_venta: { startsWith: `${abreviatura}-` },
            },
            orderBy: { venta_id: 'desc' },
            select: { numero_venta: true },
        });

        let nuevoSecuencial = 1;
        if (lastVenta) {
            const partes = lastVenta.numero_venta.split('-');
            const ultimoSec = parseInt(partes[1], 10);
            if (!isNaN(ultimoSec)) nuevoSecuencial = ultimoSec + 1;
        }

        const numeroVenta = `${abreviatura}-${nuevoSecuencial.toString().padStart(7, '0')}`;

        // ── 3. Sucursal MATRIZ ───────────────────────────────────────────────
        const matriz = await this.prisma.sucursal.findFirst({
            where: { sucursales_empresaId: empresaId, sucursales_nombre: 'MATRIZ' },
            select: { sucursales_id: true },
        });

        if (!matriz) {
            throw new NotFoundException('No se encontró la sucursal MATRIZ para esta empresa');
        }

        // ── 4. Validar stock ANTES de la TX ─────────────────────────────────
        const productosConLote = dto.productos.filter((p) => !p.es_servicio);

        if (productosConLote.length > 0) {
            const lotes = await this.prisma.itemLote.findMany({
                where: {
                    lote_id: { in: productosConLote.map((p) => p.productoId) },
                    item: { empresa_id: empresaId },
                },
                select: { lote_id: true, cantidad: true },
            });

            for (const producto of productosConLote) {
                const lote = lotes.find((l) => l.lote_id === producto.productoId);
                if (!lote) {
                    throw new NotFoundException(`Lote ${producto.productoId} no encontrado`);
                }
                if (lote.cantidad < producto.cantidad) {
                    throw new BadRequestException(
                        `Stock insuficiente para lote ${producto.productoId}. ` +
                        `Disponible: ${lote.cantidad}, solicitado: ${producto.cantidad}`,
                    );
                }
            }
        }

        // ── 5. TX: solo inserts de venta + detalles (sin SRI, sin Drive) ─────
        const ventaId = await this.prisma.$transaction(async (tx) => {

            const venta = await tx.venta.create({
                data: {
                    empresa_id: empresaId,
                    cliente_id: dto.clienteId,
                    fecha_emision: new Date(dto.fechaEmision),
                    tipo_comprobante_id: dto.tipoComprobante,
                    moneda: dto.moneda,
                    forma_pago_id: dto.formaPago,
                    plazo_pago: dto.plazoPago ?? null,
                    observaciones: dto.observaciones ?? null,
                    subtotal: dto.subtotal,
                    descuento_total: dto.descuentoTotal,
                    iva: dto.iva,
                    propina: dto.propina,
                    total: dto.total,
                    numero_venta: numeroVenta,
                    ventas_usuario_id: user.sub,
                    ventas_sucursales_id: matriz.sucursales_id,
                },
                select: { venta_id: true },
            });

            for (const producto of dto.productos) {
                if (producto.es_servicio) {
                    await tx.detalleVenta.create({
                        data: {
                            venta_id: venta.venta_id,
                            lote_id: null,
                            item_id: producto.productoId,
                            cantidad: producto.cantidad,
                            precio_unitario: producto.precioUnitario,
                            descuento: producto.descuento,
                            tarifa_impuesto_id: producto.codigoImpuesto,
                        },
                    });
                } else {
                    await tx.detalleVenta.create({
                        data: {
                            venta_id: venta.venta_id,
                            lote_id: producto.productoId,
                            item_id: null,
                            cantidad: producto.cantidad,
                            precio_unitario: producto.precioUnitario,
                            descuento: producto.descuento,
                            tarifa_impuesto_id: producto.codigoImpuesto,
                        },
                    });

                    await tx.itemLote.update({
                        where: { lote_id: producto.productoId },
                        data: { cantidad: { decrement: producto.cantidad } },
                    });
                }
            }

            return venta.venta_id;
        }); // ← TX hace commit aquí — venta ya existe en BD

        // ── 6. Factura FUERA de TX — la venta ya está commiteada ────────────
        let facData: any = null;

        if (dto.tipoComprobante === 2) {
            facData = await this.facturasService.generateInvoice(dto, ventaId, user);
        }
        return {
            success: true,
            ventaId,
            numeroVenta,
            facData,
        };
    }

    async get5LastSales(user: JwtPayload): Promise<Get5LastSalesResponseDto[]> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException('Sin empresa asignada en el token');

        const ventas = await this.prisma.venta.findMany({
            where: { empresa_id: empresaId },
            orderBy: { fecha_emision: 'desc' },
            take: 5,
            select: {
                venta_id: true,
                numero_venta: true,
                fecha_emision: true,
                total: true,
                detalles: {
                    select: {
                        detalle_id: true,
                        cantidad: true,
                        precio_unitario: true,
                        descuento: true,
                        tarifaImpuesto: {
                            select: {
                                tarifa_nombre: true,
                                tarifa_porcentaje: true,
                            },
                        },
                        // ── PRODUCTO: viene por lote → item ──────────────────────────
                        lote: {
                            select: {
                                item: {
                                    select: {
                                        item_codigo_principal: true,
                                        item_nombre: true,
                                        modelos: {
                                            select: {
                                                model: { select: { models_name: true } },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        // ── SERVICIO: viene directo por item ─────────────────────────
                        item: {
                            select: {
                                item_codigo_principal: true,
                                item_nombre: true,
                                modelos: {
                                    select: {
                                        model: { select: { models_name: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        return ventas.map((v) => ({
            saleId: v.venta_id,
            saleNumber: v.numero_venta,
            issueDate: v.fecha_emision,
            totalAmount: Number(v.total),

            items: v.detalles.map((d) => {
                // ── Resolver item independiente del tipo ─────────────────────────
                const esServicio = d.lote === null;
                const itemData = esServicio ? d.item : d.lote?.item;

                // GROUP_CONCAT modelos
                const modelos = itemData?.modelos.length
                    ? [...new Set(itemData.modelos.map((m) => m.model.models_name))].join(' / ')
                    : 'Sin modelo';

                const productName = itemData
                    ? `${itemData.item_codigo_principal} - ${itemData.item_nombre} [${modelos}]`
                    : 'Ítem no encontrado';

                return {
                    detailId: d.detalle_id,
                    productName,
                    quantity: d.cantidad,
                    unitPrice: Number(d.precio_unitario),
                    discount: Number(d.descuento),
                    taxName: d.tarifaImpuesto.tarifa_nombre,
                    taxPercentage: Number(d.tarifaImpuesto.tarifa_porcentaje),
                    es_servicio: esServicio,
                };
            }),
        }));
    }

    async listSales(
        dto: ListSalesBodyDto,
        user: JwtPayload,
    ): Promise<ListSalesResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException('Sin empresa asignada en el token');

        const {
            searchQuery,
            tipo_comprobante_id,
            fechaDesde,
            fechaHasta,
            pageIndex = 0,
            pageSize = 30,
        } = dto.filters ?? {};

        const search = searchQuery?.trim();

        // ── Construir where ──────────────────────────────────────────────────
        const where: Prisma.VentaWhereInput = {
            empresa_id: empresaId,

            // Filtro por tipo de comprobante
            ...(tipo_comprobante_id
                ? { tipo_comprobante_id }
                : {}),

            // Filtro por rango de fechas
            ...(fechaDesde || fechaHasta
                ? {
                    fecha_emision: {
                        ...(fechaDesde && { gte: new Date(fechaDesde) }),
                        ...(fechaHasta && {
                            lte: new Date(new Date(fechaHasta).setHours(23, 59, 59, 999)),
                        }),
                    },
                }
                : {}),

            // Búsqueda por número de venta, razón social o RUC/identificación
            ...(search
                ? {
                    OR: [
                        { numero_venta: { contains: search, mode: 'insensitive' } },
                        { cliente: { razon_social: { contains: search, mode: 'insensitive' } } },
                        { cliente: { identificacion: { contains: search, mode: 'insensitive' } } },
                    ],
                }
                : {}),
        };

        // ── Ejecutar count + data + catálogo en paralelo ─────────────────────
        const [total, rows, tiposComprobante] = await Promise.all([

            this.prisma.venta.count({ where }),

            this.prisma.venta.findMany({
                where,
                orderBy: { fecha_creacion: 'desc' },
                skip: pageIndex * pageSize,
                take: pageSize,
                select: {
                    venta_id: true,
                    numero_venta: true,
                    fecha_emision: true,
                    total: true,
                    cliente: {
                        select: {
                            razon_social: true,
                            identificacion: true,
                        },
                    },
                    tipoComprobante: {
                        select: { nombre: true },
                    },
                    formaPago: {
                        select: { nombre: true },
                    },
                    detalles: {
                        select: {
                            lote: {
                                select: {
                                    numero_lote: true,
                                    item: {
                                        select: {
                                            item_codigo_principal: true,
                                            item_nombre: true,
                                        },
                                    },
                                },
                            },
                            item: {
                                select: {
                                    item_codigo_principal: true,
                                    item_nombre: true,
                                },
                            },
                        },
                    },
                },
            }),

            // Catálogo de tipos de comprobante para el selector del frontend
            this.prisma.tipoComprobante.findMany({
                select: { tipo_comprobante_id: true, nombre: true },
                orderBy: { nombre: 'asc' },
            }),
        ]);

        // ── Mapear ───────────────────────────────────────────────────────────
        const sales: SaleListItemDto[] = rows.map((v) => ({
            sale_id: v.venta_id,
            sale_number: v.numero_venta,
            customer: v.cliente.razon_social,
            issue_date: v.fecha_emision,
            document_type: v.tipoComprobante.nombre,
            payment_method: v.formaPago.nombre,
            total_amount: Number(v.total),

            items: v.detalles.map((d) => {
                const esServicio = d.lote === null;
                const itemData = esServicio ? d.item : d.lote?.item;

                return {
                    code: itemData?.item_codigo_principal ?? '',
                    name: itemData?.item_nombre ?? 'Ítem no encontrado',
                    lot: esServicio ? null : (d.lote?.numero_lote ?? null),
                    es_servicio: esServicio,
                };
            }),
        }));

        return {
            total,
            sales,
            tiposComprobante: tiposComprobante.map((t) => ({
                id: t.tipo_comprobante_id,
                name: t.nombre,
            })),
        };
    }
}
