import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { FindModelsBodyDto } from './dto/request/find-models-body.dto';
import type { ModelItemDto } from './dto/response/find-models-response.dto';
import { TarifaItemDto } from './dto/response/find-percentajes-response.dto';
import { FindPercentajesBodyDto } from './dto/request/find-percentajes-body.dto';
import { CategoryItemDto } from '../items/dto/response/list-items-response.dto';
import { TipoIdentificacionDto } from '../clientes/dto/response/get-new-data-client-response.dto';
import { IdNameDto, TaxItemDto } from './dto/response/catalogos-shared.dto';
import { GetNewDataComprasResponseDto } from './dto/response/get-new-data-compras-response.dto';

@Injectable()
export class CatalogosService {
    constructor(private readonly prisma: PrismaService) { }

    async findModels(dto: FindModelsBodyDto): Promise<ModelItemDto[]> {
        const rows = await this.prisma.model.findMany({
            where: {
                models_brands_id: dto.id,
            },
            select: {
                models_id: true,
                models_name: true,
            },
            orderBy: {
                models_name: 'asc',
            },
        });

        const models: ModelItemDto[] = rows.map((m) => ({
            id: m.models_id,
            name: m.models_name,
        }));
        console.log(models)
        return models;
    }
    async findPercentajes(dto: FindPercentajesBodyDto): Promise<TarifaItemDto[]> {
        const rows = await this.prisma.tarifaImpuesto.findMany({
            where: { tipo_impuesto_id: dto.id },
            select: {
                tarifa_impuesto_id: true,
                tarifa_nombre: true,
                tarifa_codigo_sri: true,
                tarifa_porcentaje: true,
                tarifa_descripcion: true,
            },
            orderBy: { tarifa_nombre: 'asc' },
        });

        return rows.map((t) => ({
            id: t.tarifa_impuesto_id,
            name: t.tarifa_nombre,
            codigoSri: t.tarifa_codigo_sri,
            porcentaje: Number(t.tarifa_porcentaje),
            descripcion: t.tarifa_descripcion,
        }));
    }
    async getCategories(): Promise<CategoryItemDto[]> {
        const rows = await this.prisma.tipoItem.findMany({
            select: {
                tipo_item_id: true,
                tipo_item_nombre: true,
            },
            orderBy: { tipo_item_nombre: 'asc' },
        });

        return rows.map((c) => ({
            id: c.tipo_item_id,
            name: c.tipo_item_nombre,
        }));
    }
    async getTiposIdentificacion(): Promise<TipoIdentificacionDto[]> {
        const rows = await this.prisma.tipoIdentificacionSri.findMany({
            select: {
                codigo: true,
                descripcion: true,
            },
            orderBy: { descripcion: 'asc' },
        });

        return rows.map((t) => ({
            id: t.codigo,
            name: t.descripcion,
        }));
    }

    // ── findTaxes ─────────────────────────────────────────────────────────
    async findTaxes(): Promise<TaxItemDto[]> {
        const rows = await this.prisma.tarifaImpuesto.findMany({
            select: {
                tarifa_impuesto_id: true,
                tarifa_nombre: true,
                tarifa_porcentaje: true,
                tipoImpuesto: {
                    select: { tipo_impuesto_nombre: true },
                },
            },
            orderBy: { tarifa_impuesto_id: 'asc' },
        });

        return rows.map((t) => ({
            id: t.tarifa_impuesto_id,
            name: `${t.tipoImpuesto.tipo_impuesto_nombre} - ${t.tarifa_nombre}`,
            percentage: Number(t.tarifa_porcentaje),
        }));
    }

    // ── findVoucherType ───────────────────────────────────────────────────
    async findVoucherType(): Promise<IdNameDto[]> {
        const rows = await this.prisma.tipoComprobante.findMany({
            select: {
                tipo_comprobante_id: true,
                nombre: true,
            },
            orderBy: { nombre: 'asc' },
        });

        return rows.map((v) => ({
            id: v.tipo_comprobante_id,
            name: v.nombre,
        }));
    }

    // ── findPayType ───────────────────────────────────────────────────────
    async findPayType(): Promise<IdNameDto[]> {
        const rows = await this.prisma.formaPago.findMany({
            select: {
                forma_pago_id: true,
                nombre: true,
            },
            orderBy: { nombre: 'asc' },
        });

        return rows.map((f) => ({
            id: f.forma_pago_id,
            name: f.nombre,
        }));
    }

    async getEstadosSri(): Promise<IdNameDto[]> {
        const rows = await this.prisma.estadoSri.findMany({
            select: { estado_sri_id: true, codigo: true },
            orderBy: { codigo: 'asc' },
        });
        return rows.map((e) => ({ id: e.estado_sri_id, name: e.codigo }));
    }

    async getPaises(): Promise<IdNameDto[]> {
        const rows = await this.prisma.pais.findMany({
            where: { activo: true },
            select: { pais_id: true, nombre: true, codigo_iso: true },
            orderBy: { nombre: 'asc' },
        });
        return rows.map((p) => ({ id: p.pais_id, name: `${p.codigo_iso} - ${p.nombre}` }));
    }

    async getTiposDocumentoCompra(): Promise<IdNameDto[]> {
        const rows = await this.prisma.tipoDocumentoCompra.findMany({
            where: { tipo_doc_activo: true },
            select: { tipo_doc_id: true, tipo_doc_nombre: true },
            orderBy: { tipo_doc_nombre: 'asc' },
        });
        return rows.map((t) => ({ id: t.tipo_doc_id, name: t.tipo_doc_nombre }));
    }

    async getNewDataCompras(): Promise<GetNewDataComprasResponseDto> {
        const [tiposDocumento, estadosPago, tiposIdentificacion, paises] = await Promise.all([
            this.prisma.tipoDocumentoCompra.findMany({
                where: { tipo_doc_activo: true },
                select: { tipo_doc_id: true, tipo_doc_nombre: true },
                orderBy: { tipo_doc_nombre: 'asc' },
            }),
            this.prisma.estadoPagoCompra.findMany({
                select: { estado_pago_id: true, estado_pago_nombre: true },
                orderBy: { estado_pago_id: 'asc' },
            }),
            this.getTiposIdentificacion(),
            this.getPaises(),
        ]);

        return {
            tiposDocumento: tiposDocumento.map((t) => ({
                id: t.tipo_doc_id,
                name: t.tipo_doc_nombre,
            })),
            estadosPago: estadosPago.map((e) => ({
                id: e.estado_pago_id,
                name: e.estado_pago_nombre,
            })),
            tiposIdentificacion,
            paises,
        };
    }
}