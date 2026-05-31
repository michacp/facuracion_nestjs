import {
    Injectable, UnauthorizedException,
    BadRequestException, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogosService } from '../catalogos/catalogos.service';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { SaveCompraBodyDto } from './dto/request/save-compra-body.dto';
import type { SaveCompraResponseDto, DetalleCompraResponseDto } from './dto/response/save-compra-response.dto';
import type { GetNewDataComprasResponseDto } from '../catalogos/dto/response/get-new-data-compras-response.dto';
import { CompraListItemDto, ListComprasResponseDto } from './dto/response/list-compras-response.dto';
import { ListComprasBodyDto } from './dto/request/list-compras-body.dto';
import { Prisma } from '@prisma/client';
import { GetCompraBodyDto } from './dto/request/get-compra-body.dto';
import { GetCompraResponseDto } from './dto/response/get-compra-response.dto';
import { UpdateCompraFieldBodyDto } from './dto/request/update-compra-field-body.dto';
import { AddItemCompraResponseDto, RemoveItemCompraResponseDto, UpdateCompraResponseDto } from './dto/response/update-compra-response.dto';
import { AddItemCompraBodyDto } from './dto/request/add-item-compra-body.dto';
import { RemoveItemCompraBodyDto } from './dto/request/remove-item-compra-body.dto';

@Injectable()
export class ComprasService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly catalogosService: CatalogosService,
    ) { }

    // ── GET getnewdata ───────────────────────────────────────────────────
    async getNewData(): Promise<GetNewDataComprasResponseDto> {
        return this.catalogosService.getNewDataCompras();
    }

    // ── POST save ────────────────────────────────────────────────────────
    async save(dto: SaveCompraBodyDto, user: JwtPayload): Promise<SaveCompraResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        if (!dto.detalles.length) {
            throw new BadRequestException('La compra debe tener al menos un ítem');
        }

        // ── 1. Validar proveedor pertenece a la empresa ───────────────────
        const proveedor = await this.prisma.proveedor.findFirst({
            where: {
                proveedor_id: dto.proveedor_id,
                empresa_id: empresaId,
                deleted_at: null,
            },
            select: { proveedor_id: true },
        });

        if (!proveedor) throw new NotFoundException('Proveedor no encontrado');

        // ── 2. Validar que todos los ítems pertenecen a la empresa ────────
        const itemIds = dto.detalles.map((d) => d.item_id);

        const items = await this.prisma.item.findMany({
            where: {
                item_id: { in: itemIds },
                empresa_id: empresaId,
                item_activo: true,
            },
            select: { item_id: true },
        });

        if (items.length !== itemIds.length) {
            throw new NotFoundException('Uno o más ítems no encontrados o no pertenecen a la empresa');
        }

        // ── 3. Obtener sucursal MATRIZ ────────────────────────────────────
        const sucursal = await this.prisma.sucursal.findFirst({
            where: { sucursales_empresaId: empresaId, sucursales_nombre: 'MATRIZ' },
            select: { sucursales_id: true },
        });

        if (!sucursal) throw new NotFoundException('Sucursal MATRIZ no encontrada');

        // ── 4. Estado pago inicial = PENDIENTE ────────────────────────────
        const estadoPendiente = await this.prisma.estadoPagoCompra.findFirst({
            where: { estado_pago_codigo: 'PENDIENTE' },
            select: { estado_pago_id: true },
        });

        if (!estadoPendiente) throw new NotFoundException('Estado PENDIENTE no configurado');

        // ── 5. Transacción ────────────────────────────────────────────────
        const result = await this.prisma.$transaction(async (tx) => {

            // 5a. Crear compra
            const compra = await tx.compra.create({
                data: {
                    empresa_id: empresaId,
                    proveedor_id: dto.proveedor_id,
                    sucursal_id: sucursal.sucursales_id,
                    usuario_id: user.sub,
                    tipo_doc_id: dto.tipo_doc_id,
                    estado_pago_id: estadoPendiente.estado_pago_id,
                    numero_documento: dto.numero_documento,
                    fecha_emision: new Date(dto.fecha_emision),
                    subtotal: dto.subtotal,
                    descuento_global: dto.descuento_global ?? 0,
                    porcentaje_impuesto: dto.porcentaje_impuesto ?? 0,
                    valor_impuesto: dto.valor_impuesto ?? 0,
                    gastos_envio: dto.gastos_envio ?? 0,
                    total_pagar: dto.total_pagar,
                    total_pagado: 0,
                    observaciones: dto.observaciones ?? null,
                },
                select: { compra_id: true },
            });

            const detallesResult: DetalleCompraResponseDto[] = [];

            for (const d of dto.detalles) {
                const subtotalLinea =
                    (d.cantidad * d.costo_unitario) - (d.descuento_linea ?? 0);

                // 5b. Generar número de lote automático: compra_id + item_id
                const numeroLote = `C${compra.compra_id.toString().padStart(6, '0')}-${d.item_id}`;

                // 5c. Crear lote — ingresa stock
                const lote = await tx.itemLote.create({
                    data: {
                        item_id: d.item_id,
                        numero_lote: numeroLote,
                        cantidad: d.cantidad,
                        observaciones: `Compra #${compra.compra_id} — ${dto.numero_documento}`,
                    },
                    select: { lote_id: true },
                });

                // 5d. Crear detalle de compra
                const detalle = await tx.detalleCompra.create({
                    data: {
                        compra_id: compra.compra_id,
                        item_id: d.item_id,
                        lote_id: lote.lote_id,
                        cantidad: d.cantidad,
                        costo_unitario: d.costo_unitario,
                        descuento_linea: d.descuento_linea ?? 0,
                        subtotal_linea: subtotalLinea,
                        precio_venta_sugerido: d.precio_venta_sugerido ?? null,
                    },
                    select: { detalle_id: true },
                });

                // 5e. Actualizar PVP si el usuario lo indicó
                let pvpActualizado = false;
                if (d.aplicar_pvp && d.precio_venta_sugerido) {
                    await tx.item.update({
                        where: { item_id: d.item_id },
                        data: { item_precio_unitario: d.precio_venta_sugerido },
                    });
                    pvpActualizado = true;
                }

                detallesResult.push({
                    detalle_id: detalle.detalle_id,
                    item_id: d.item_id,
                    lote_id: lote.lote_id,
                    cantidad: d.cantidad,
                    pvp_actualizado: pvpActualizado,
                });
            }

            return { compra_id: compra.compra_id, detalles: detallesResult };
        });

        return {
            compra_id: result.compra_id,
            numero_documento: dto.numero_documento,
            total_pagar: dto.total_pagar,
            detalles: result.detalles,
        };
    }

    async listCompras(
        dto: ListComprasBodyDto,
        user: JwtPayload,
    ): Promise<ListComprasResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const { search, fechaDesde, fechaHasta, estadoPago, page = 0, limit = 30 } = dto;
        const term = search?.trim();

        const where: Prisma.CompraWhereInput = {
            empresa_id: empresaId,

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

            ...(estadoPago?.trim()
                ? { estadoPago: { estado_pago_codigo: estadoPago.trim() } }
                : {}),

            ...(term
                ? {
                    OR: [
                        { numero_documento: { contains: term, mode: 'insensitive' } },
                        {
                            proveedor: {
                                OR: [
                                    { razon_social: { contains: term, mode: 'insensitive' } },
                                    { identificacion: { contains: term, mode: 'insensitive' } },
                                ],
                            },
                        },
                    ],
                }
                : {}),
        };

        const [total, rows, estadosPago] = await Promise.all([
            this.prisma.compra.count({ where }),

            this.prisma.compra.findMany({
                where,
                orderBy: { compra_creadoEn: 'desc' },
                skip: page * limit,
                take: limit,
                select: {
                    compra_id: true,
                    numero_documento: true,
                    fecha_emision: true,
                    subtotal: true,
                    valor_impuesto: true,
                    total_pagar: true,
                    total_pagado: true,
                    tipoDoc: {
                        select: { tipo_doc_nombre: true },
                    },
                    estadoPago: {
                        select: { estado_pago_codigo: true },
                    },
                    proveedor: {
                        select: {
                            razon_social: true,
                            identificacion: true,
                        },
                    },
                    detalles: {
                        select: {
                            cantidad: true,
                            item_id: true,
                        },
                    },
                },
            }),

            // Catálogo de estados para el selector del frontend
            this.prisma.estadoPagoCompra.findMany({
                select: { estado_pago_id: true, estado_pago_codigo: true },
                orderBy: { estado_pago_id: 'asc' },
            }),
        ]);

        const compras: CompraListItemDto[] = rows.map((c) => {
            const itemsDistintos = new Set(c.detalles.map((d) => d.item_id)).size;
            const totalUnidades = c.detalles.reduce((acc, d) => acc + d.cantidad, 0);

            return {
                compra_id: c.compra_id,
                numero_documento: c.numero_documento,
                tipo_documento: c.tipoDoc.tipo_doc_nombre,
                proveedor: c.proveedor.razon_social,
                proveedor_identificacion: c.proveedor.identificacion,
                fecha_emision: c.fecha_emision,
                subtotal: Number(c.subtotal),
                valor_impuesto: Number(c.valor_impuesto),
                total_pagar: Number(c.total_pagar),
                total_pagado: Number(c.total_pagado),
                estado_pago: c.estadoPago.estado_pago_codigo,
                total_items: itemsDistintos,
                total_unidades: totalUnidades,
            };
        });

        return {
            total,
            compras,
            estadosPago: estadosPago.map((e) => ({
                id: e.estado_pago_id,
                name: e.estado_pago_codigo,
            })),
        };
    }
    async getCompra(
        dto: GetCompraBodyDto,
        user: JwtPayload,
    ): Promise<GetCompraResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const compra = await this.prisma.compra.findFirst({
            where: {
                compra_id: dto.compra_id,
                empresa_id: empresaId, // ← multi-tenant
            },
            select: {
                compra_id: true,
                numero_documento: true,
                fecha_emision: true,
                subtotal: true,
                descuento_global: true,
                porcentaje_impuesto: true,
                valor_impuesto: true,
                gastos_envio: true,
                total_pagar: true,
                total_pagado: true,
                observaciones: true,
                tipoDoc: {
                    select: { tipo_doc_nombre: true },
                },
                estadoPago: {
                    select: { estado_pago_codigo: true },
                },
                proveedor: {
                    select: {
                        razon_social: true,
                        identificacion: true,
                        nombre_comercial: true,
                        email: true,
                        telefono: true,
                        pais: {
                            select: { nombre: true },
                        },
                    },
                },
                usuario: {
                    select: { usuarios_username: true },
                },
                detalles: {
                    select: {
                        detalle_id: true,
                        cantidad: true,
                        costo_unitario: true,
                        descuento_linea: true,
                        subtotal_linea: true,
                        precio_venta_sugerido: true,
                        item: {
                            select: {
                                item_id: true,
                                item_codigo_principal: true,
                                item_nombre: true,
                            },
                        },
                        lote: {
                            select: { lote_id: true, numero_lote: true },
                        },
                    },
                    orderBy: { detalle_id: 'asc' },
                },
            },
        });

        if (!compra) throw new NotFoundException('Compra no encontrada');

        const totalPagar = Number(compra.total_pagar);
        const totalPagado = Number(compra.total_pagado);

        return {
            compra_id: compra.compra_id,
            numero_documento: compra.numero_documento,
            tipo_documento: compra.tipoDoc.tipo_doc_nombre,
            fecha_emision: compra.fecha_emision,
            proveedor: compra.proveedor.razon_social,
            proveedor_identificacion: compra.proveedor.identificacion,
            proveedor_nombre_comercial: compra.proveedor.nombre_comercial,
            proveedor_email: compra.proveedor.email,
            proveedor_telefono: compra.proveedor.telefono,
            proveedor_pais: compra.proveedor.pais.nombre,
            subtotal: Number(compra.subtotal),
            descuento_global: Number(compra.descuento_global),
            porcentaje_impuesto: Number(compra.porcentaje_impuesto),
            valor_impuesto: Number(compra.valor_impuesto),
            gastos_envio: Number(compra.gastos_envio),
            total_pagar: totalPagar,
            total_pagado: totalPagado,
            saldo_pendiente: Math.max(0, totalPagar - totalPagado),
            estado_pago: compra.estadoPago.estado_pago_codigo,
            usuario_registro: compra.usuario.usuarios_username,
            observaciones: compra.observaciones,
            detalles: compra.detalles.map((d) => ({
                detalle_id: d.detalle_id,
                item_id: d.item.item_id,
                codigo: d.item.item_codigo_principal,
                nombre: d.item.item_nombre,
                lote_id: d.lote?.lote_id ?? null,
                numero_lote: d.lote?.numero_lote ?? null,
                cantidad: d.cantidad,
                costo_unitario: Number(d.costo_unitario),
                descuento_linea: Number(d.descuento_linea),
                subtotal_linea: Number(d.subtotal_linea),
                precio_venta_sugerido: d.precio_venta_sugerido
                    ? Number(d.precio_venta_sugerido)
                    : null,
            })),
        };
    }


    // ── updateField ──────────────────────────────────────────────────────
    async updateField(
        dto: UpdateCompraFieldBodyDto,
        user: JwtPayload,
    ): Promise<UpdateCompraResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        // Guard multi-tenant
        const compra = await this.prisma.compra.findFirst({
            where: { compra_id: dto.compra_id, empresa_id: empresaId },
            select: {
                compra_id: true,
                subtotal: true,
                descuento_global: true,
                porcentaje_impuesto: true,
                valor_impuesto: true,
                gastos_envio: true,
                total_pagar: true,
            },
        });

        if (!compra) throw new NotFoundException('Compra no encontrada');

        // Construir data de actualización según el campo
        const data: any = {};

        switch (dto.campo) {
            case 'numero_documento':
                data.numero_documento = String(dto.valor).trim();
                break;

            case 'fecha_emision':
                data.fecha_emision = new Date(dto.valor);
                break;

            case 'observaciones':
                data.observaciones = String(dto.valor).trim() || null;
                break;

            case 'tipo_doc_id':
                // Validar que existe
                const tipoDoc = await this.prisma.tipoDocumentoCompra.findUnique({
                    where: { tipo_doc_id: Number(dto.valor) },
                });
                if (!tipoDoc) throw new NotFoundException('Tipo de documento no encontrado');
                data.tipo_doc_id = Number(dto.valor);
                break;

            case 'estado_pago_id':
                const estadoPago = await this.prisma.estadoPagoCompra.findUnique({
                    where: { estado_pago_id: Number(dto.valor) },
                });
                if (!estadoPago) throw new NotFoundException('Estado de pago no encontrado');
                data.estado_pago_id = Number(dto.valor);
                break;

            case 'proveedor_id':
                // Validar que el proveedor pertenece a la empresa
                const proveedor = await this.prisma.proveedor.findFirst({
                    where: {
                        proveedor_id: Number(dto.valor),
                        empresa_id: empresaId,
                        deleted_at: null,
                    },
                });
                if (!proveedor) throw new NotFoundException('Proveedor no encontrado');
                data.proveedor_id = Number(dto.valor);
                break;

            case 'descuento_global':
            case 'gastos_envio':
                data[dto.campo] = Number(dto.valor);
                break;
        }

        // Si cambió descuento_global o gastos_envio → recalcular totales
        if (dto.campo === 'descuento_global' || dto.campo === 'gastos_envio') {
            const nuevoDescuento = dto.campo === 'descuento_global'
                ? Number(dto.valor)
                : Number(compra.descuento_global);

            const nuevosGastos = dto.campo === 'gastos_envio'
                ? Number(dto.valor)
                : Number(compra.gastos_envio);

            const base = Number(compra.subtotal) - nuevoDescuento;
            const valorIva = base * (Number(compra.porcentaje_impuesto) / 100);
            data.valor_impuesto = parseFloat(valorIva.toFixed(2));
            data.total_pagar = parseFloat((base + valorIva + nuevosGastos).toFixed(2));
        }

        await this.prisma.compra.update({
            where: { compra_id: dto.compra_id },
            data,
        });

        return { success: true, campo: dto.campo, valorNuevo: dto.valor };
    }

    // ── addItem ───────────────────────────────────────────────────────────
    async addItem(
        dto: AddItemCompraBodyDto,
        user: JwtPayload,
    ): Promise<AddItemCompraResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        // Validar compra
        const compra = await this.prisma.compra.findFirst({
            where: { compra_id: dto.compra_id, empresa_id: empresaId },
            select: {
                compra_id: true,
                subtotal: true,
                descuento_global: true,
                porcentaje_impuesto: true,
                gastos_envio: true,
            },
        });
        if (!compra) throw new NotFoundException('Compra no encontrada');

        // Validar ítem
        const item = await this.prisma.item.findFirst({
            where: { item_id: dto.item_id, empresa_id: empresaId, item_activo: true },
            select: { item_id: true },
        });
        if (!item) throw new NotFoundException('Ítem no encontrado');

        const subtotalLinea = (dto.cantidad * dto.costo_unitario) - (dto.descuento_linea ?? 0);
        const numeroLote = `C${dto.compra_id.toString().padStart(6, '0')}-${dto.item_id}-E`;

        const result = await this.prisma.$transaction(async (tx) => {

            // Crear lote
            const lote = await tx.itemLote.create({
                data: {
                    item_id: dto.item_id,
                    numero_lote: numeroLote,
                    cantidad: dto.cantidad,
                    observaciones: `Compra #${dto.compra_id} — ítem agregado posteriormente`,
                },
                select: { lote_id: true, numero_lote: true },
            });

            // Crear detalle
            const detalle = await tx.detalleCompra.create({
                data: {
                    compra_id: dto.compra_id,
                    item_id: dto.item_id,
                    lote_id: lote.lote_id,
                    cantidad: dto.cantidad,
                    costo_unitario: dto.costo_unitario,
                    descuento_linea: dto.descuento_linea ?? 0,
                    subtotal_linea: subtotalLinea,
                    precio_venta_sugerido: dto.precio_venta_sugerido ?? null,
                },
                select: { detalle_id: true },
            });

            // Actualizar PVP si se pidió
            if (dto.aplicar_pvp && dto.precio_venta_sugerido) {
                await tx.item.update({
                    where: { item_id: dto.item_id },
                    data: { item_precio_unitario: dto.precio_venta_sugerido },
                });
            }

            // Recalcular totales de la compra
            const nuevoSubtotal = Number(compra.subtotal) + subtotalLinea;
            const base = nuevoSubtotal - Number(compra.descuento_global);
            const valorIva = base * (Number(compra.porcentaje_impuesto) / 100);
            const nuevoTotal = base + valorIva + Number(compra.gastos_envio);

            await tx.compra.update({
                where: { compra_id: dto.compra_id },
                data: {
                    subtotal: parseFloat(nuevoSubtotal.toFixed(2)),
                    valor_impuesto: parseFloat(valorIva.toFixed(2)),
                    total_pagar: parseFloat(nuevoTotal.toFixed(2)),
                },
            });

            return { detalle_id: detalle.detalle_id, lote_id: lote.lote_id, numero_lote: lote.numero_lote };
        });

        return result;
    }

    // ── removeItem ────────────────────────────────────────────────────────
    async removeItem(
        dto: RemoveItemCompraBodyDto,
        user: JwtPayload,
    ): Promise<RemoveItemCompraResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        // Validar que el detalle pertenece a la compra de la empresa
        const detalle = await this.prisma.detalleCompra.findFirst({
            where: {
                detalle_id: dto.detalle_id,
                compra: { compra_id: dto.compra_id, empresa_id: empresaId },
            },
            select: {
                detalle_id: true,
                lote_id: true,
                cantidad: true,
                subtotal_linea: true,
                compra: {
                    select: {
                        subtotal: true,
                        descuento_global: true,
                        porcentaje_impuesto: true,
                        gastos_envio: true,
                    },
                },
            },
        });

        if (!detalle) throw new NotFoundException('Detalle no encontrado');

        let loteEliminado = false;

        // ── Verificar si el lote tiene ventas asociadas (Opción C) ───────────
        if (detalle.lote_id) {
            const ventasConLote = await this.prisma.detalleVenta.count({
                where: { lote_id: detalle.lote_id },
            });

            if (ventasConLote > 0) {
                throw new BadRequestException(
                    `Este ítem tiene ${ventasConLote} venta(s) asociada(s) al lote. ` +
                    `No se puede eliminar para mantener la trazabilidad del inventario.`,
                );
            }
        }

        await this.prisma.$transaction(async (tx) => {

            // Eliminar detalle
            await tx.detalleCompra.delete({
                where: { detalle_id: dto.detalle_id },
            });

            // Eliminar lote y revertir stock (solo si no tiene ventas — ya validado arriba)
            if (detalle.lote_id) {
                await tx.itemLote.delete({
                    where: { lote_id: detalle.lote_id },
                });
                loteEliminado = true;
            }

            // Recalcular totales
            const nuevoSubtotal = Number(detalle.compra.subtotal) - Number(detalle.subtotal_linea);
            const base = nuevoSubtotal - Number(detalle.compra.descuento_global);
            const valorIva = base * (Number(detalle.compra.porcentaje_impuesto) / 100);
            const nuevoTotal = base + valorIva + Number(detalle.compra.gastos_envio);

            await tx.compra.update({
                where: { compra_id: dto.compra_id },
                data: {
                    subtotal: parseFloat(Math.max(0, nuevoSubtotal).toFixed(2)),
                    valor_impuesto: parseFloat(Math.max(0, valorIva).toFixed(2)),
                    total_pagar: parseFloat(Math.max(0, nuevoTotal).toFixed(2)),
                },
            });
        });

        return {
            success: true,
            mensaje: loteEliminado
                ? 'Ítem eliminado y stock revertido correctamente'
                : 'Ítem eliminado correctamente',
            lote_eliminado: loteEliminado,
        };
    }
}