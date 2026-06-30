import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Asegúrate de tener tu PrismaService configurado
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { GetNewDataResponseDto } from './dto/response/get-new-data-response.dto';
import { SaveItemResponseDto } from './dto/response/save-item-response.dto';
import { SaveItemBodyDto } from './dto/request/save-item-body.dto';
import { Last5SavesItemDto } from './dto/response/last5-saves-response.dto';
import { CatalogosService } from '../catalogos/catalogos.service';
import { ListItemsBodyDto } from './dto/request/list-items-body.dto';
import { ListItemDto, ListItemsResponseDto } from './dto/response/list-items-response.dto';
import { Prisma } from '@prisma/client';
import { FindOneItemBodyDto } from './dto/request/find-one-item-body.dto';
import { FindOneItemResponseDto } from './dto/response/find-one-item-response.dto';
import { EditItemBodyDto } from './dto/request/edit-item-body.dto';
import { FindProductsIdNameResponseDto } from './dto/response/find-products-idname-response.dto';
import { FindProductsIdNameBodyDto } from './dto/request/find-products-idname-body.dto';
import { FindItemsPurchaseResponseDto } from './dto/response/find-items-purchase-response.dto';
import { FindItemsPurchaseBodyDto } from './dto/request/find-items-purchase-body.dto';
@Injectable()
export class ItemsService {
    constructor(private readonly prisma: PrismaService, private readonly catalogosService: CatalogosService) { }

    async getNewProductData(user: JwtPayload): Promise<GetNewDataResponseDto> {
        try {
            // Nota: Si en el futuro tus marcas (Brands) pasan a ser por empresa, 
            // podrías añadir un filtro: where: { empresa_id: user.empresa_id }
            const [brands, taxes, types] = await Promise.all([
                this.prisma.brand.findMany({
                    select: { brands_id: true, brands_name: true }
                }),
                this.prisma.tipoImpuesto.findMany({
                    select: { tipo_impuesto_id: true, tipo_impuesto_nombre: true }
                }),
                this.prisma.tipoItem.findMany({
                    select: { tipo_item_id: true, tipo_item_nombre: true }
                }),
            ]);

            // Estructuramos la respuesta idéntica al contrato original con el frontend
            return {
                brands: brands.map(b => ({ id: b.brands_id, name: b.brands_name })),
                taxes: taxes.map(t => ({ id: t.tipo_impuesto_id, name: t.tipo_impuesto_nombre })),
                type: types.map(ti => ({ id: ti.tipo_item_id, name: ti.tipo_item_nombre })),
            };
        } catch (error) {
            console.error('Error en getNewProductData de Items:', error);
            throw new InternalServerErrorException('Error al recuperar los catálogos del producto');
        }
    }



    async saveItem(dto: SaveItemBodyDto, user: JwtPayload): Promise<SaveItemResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException('Sin empresa asignada en el token');

        const tipoItem = await this.prisma.tipoItem.findUnique({
            where: { tipo_item_id: dto.tipo_item },
            select: { tipo_item_nombre: true },
        });

        if (!tipoItem) throw new NotFoundException('Tipo de ítem no encontrado');

        const esServicio = tipoItem.tipo_item_nombre.toUpperCase() === 'SERVICIO';

        const prefix = tipoItem.tipo_item_nombre
            .toUpperCase()
            .substring(0, 3)
            .padEnd(3, 'X');

        const lastItem = await this.prisma.item.findFirst({
            where: {
                empresa_id: empresaId,
                item_codigo_principal: { startsWith: prefix },
            },
            orderBy: { item_codigo_principal: 'desc' },
            select: { item_codigo_principal: true },
        });

        let nextNumber = 1;
        if (lastItem) {
            const numPart = parseInt(lastItem.item_codigo_principal.slice(3));
            if (!isNaN(numPart)) nextNumber = numPart + 1;
        }

        const paddedNumber = String(nextNumber).padStart(6, '0');
        const codigoPrincipal = `${prefix}${paddedNumber}`;
        const codigoAuxiliar = paddedNumber;

        const result = await this.prisma.$transaction(async (tx) => {
            const item = await tx.item.create({
                data: {
                    empresa_id: empresaId,
                    item_codigo_principal: codigoPrincipal,
                    item_codigo_auxiliar: codigoAuxiliar,
                    tipo_item_id: dto.tipo_item,
                    tarifa_impuesto_id: dto.id_tarifa_impuesto,
                    item_nombre: dto.nombre,
                    item_descripcion: dto.descripcion ?? '',
                    item_precio_unitario: dto.precio_unitario,
                },
                select: { item_id: true },
            });

            if (dto.modelos_ids && dto.modelos_ids.length > 0) {
                await tx.itemModelo.createMany({
                    data: dto.modelos_ids.map((modeloId) => ({
                        item_id: item.item_id,
                        models_id: modeloId,
                    })),
                    skipDuplicates: true,
                });
            }

            return item.item_id;
        });

        return {
            itemId: result,
            id: result,       // ← mismo valor, para selectores {id, name}
            name: dto.nombre,
            cod: codigoPrincipal,
            es_servicio: esServicio,
            precio_actual: dto.precio_unitario, // ← mismo campo que find-for-purchase
        };
    }


    async last5Saves(user: JwtPayload): Promise<Last5SavesItemDto[]> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException('Sin empresa asignada en el token');

        const items = await this.prisma.item.findMany({
            where: { empresa_id: empresaId },
            orderBy: { item_fecha_creacion: 'desc' },
            take: 5,
            select: {
                item_id: true,
                item_nombre: true,
                item_codigo_principal: true,
                item_precio_unitario: true,
                tipoItem: {
                    select: { tipo_item_nombre: true },
                },
                tarifaImpuesto: {
                    select: {
                        tarifa_nombre: true,
                        tipoImpuesto: {
                            select: { tipo_impuesto_nombre: true },
                        },
                    },
                },
                lotes: { select: { cantidad: true } },
                modelos: {
                    select: {
                        model: {
                            select: {
                                models_name: true,
                                brand: { select: { brands_name: true } },
                            },
                        },
                    },
                },
            },
        });

        return items.map((i) => {
            const esServicio = i.tipoItem.tipo_item_nombre.toUpperCase() === 'SERVICIO';

            // null para servicios, suma real para productos
            const stock = esServicio
                ? null
                : i.lotes.reduce((acc, l) => acc + l.cantidad, 0);

            const modelos = i.modelos.length
                ? [...new Set(i.modelos.map((m) => m.model.models_name))].join(', ')
                : null;

            const marcas = i.modelos.length
                ? [...new Set(i.modelos.map((m) => m.model.brand.brands_name))].join(', ')
                : null;

            return {
                id: i.item_id,
                nombre: i.item_nombre,
                codigo: i.item_codigo_principal,
                precio: Number(i.item_precio_unitario),
                stock,
                tipo_nombre: i.tipoItem.tipo_item_nombre,
                impuesto_nombre: i.tarifaImpuesto.tarifa_nombre,
                impuesto_tipo_nombre: i.tarifaImpuesto.tipoImpuesto.tipo_impuesto_nombre,
                modelos,
                marcas,
                es_servicio: esServicio,
            };
        });
    }

    // ── listItems ─────────────────────────────────────────────────────────
    async listItems(dto: ListItemsBodyDto, user: JwtPayload): Promise<ListItemsResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException('Sin empresa asignada en el token');

        const { search = '', category, page = 0, limit = 10 } = dto;

        const trimmedSearch = search.trim();
        const isNumericSearch = /^\d+$/.test(trimmedSearch);
        const offset = page * limit;

        const where: Prisma.ItemWhereInput = {
            empresa_id: empresaId,

            ...(category && { tipo_item_id: category }),

            ...(trimmedSearch && {
                ...(isNumericSearch
                    ? {
                        OR: [
                            { item_codigo_auxiliar: trimmedSearch },
                            { item_codigo_auxiliar: trimmedSearch.padStart(6, '0') },
                        ],
                    }
                    : {
                        OR: [
                            { item_nombre: { contains: trimmedSearch, mode: 'insensitive' } },
                            {
                                modelos: {
                                    some: {
                                        model: {
                                            OR: [
                                                { models_name: { contains: trimmedSearch, mode: 'insensitive' } },
                                                { brand: { brands_name: { contains: trimmedSearch, mode: 'insensitive' } } },
                                            ],
                                        },
                                    },
                                },
                            },
                        ],
                    }),
            }),
        };

        const [total, rows, categories] = await Promise.all([

            this.prisma.item.count({ where }),

            this.prisma.item.findMany({
                where,
                orderBy: { item_id: 'desc' },
                skip: offset,
                take: limit,
                select: {
                    item_id: true,
                    item_nombre: true,
                    item_codigo_principal: true,
                    item_precio_unitario: true,
                    tipoItem: {
                        select: { tipo_item_nombre: true },
                    },
                    tarifaImpuesto: {
                        select: {
                            tarifa_nombre: true,
                            tipoImpuesto: {
                                select: { tipo_impuesto_nombre: true },
                            },
                        },
                    },
                    lotes: { select: { cantidad: true } },
                    modelos: {
                        select: {
                            model: {
                                select: {
                                    models_name: true,
                                    brand: { select: { brands_name: true } },
                                },
                            },
                        },
                    },
                },
            }),

            this.catalogosService.getCategories(),
        ]);

        const items: ListItemDto[] = rows.map((i) => {
            const esServicio = i.tipoItem.tipo_item_nombre.toUpperCase() === 'SERVICIO';

            const stock = esServicio
                ? null
                : i.lotes.reduce((acc, l) => acc + l.cantidad, 0);

            const modelos = i.modelos.length
                ? [...new Set(i.modelos.map((m) => m.model.models_name))].join(', ')
                : null;

            const marcas = i.modelos.length
                ? [...new Set(i.modelos.map((m) => m.model.brand.brands_name))].join(', ')
                : null;

            return {
                id: i.item_id,
                nombre: i.item_nombre,
                codigo: i.item_codigo_principal,
                precio: Number(i.item_precio_unitario),
                stock,
                tipo_nombre: i.tipoItem.tipo_item_nombre,
                impuesto_nombre: i.tarifaImpuesto.tarifa_nombre,
                impuesto_tipo_nombre: i.tarifaImpuesto.tipoImpuesto.tipo_impuesto_nombre,
                modelos,
                marcas,
                es_servicio: esServicio,
            };
        });

        return { total, items, categories };
    }
    async findOneItem(
        dto: FindOneItemBodyDto,
        user: JwtPayload,
    ): Promise<FindOneItemResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException('Sin empresa asignada en el token');

        const item = await this.prisma.item.findFirst({
            where: {
                item_id: dto.id,
                empresa_id: empresaId, // ← multi-tenant: solo puede ver sus propios ítems
            },
            select: {
                item_id: true,
                item_codigo_principal: true,
                item_nombre: true,
                item_descripcion: true,
                item_precio_unitario: true,

                // Tarifa + tipo impuesto anidado
                tarifaImpuesto: {
                    select: {
                        tarifa_codigo_sri: true,
                        tarifa_porcentaje: true,
                        tarifa_nombre: true,
                        tipoImpuesto: {
                            select: {
                                tipo_impuesto_codigo_sri: true,
                                tipo_impuesto_nombre: true,
                            },
                        },
                    },
                },

                // Modelos compatibles
                modelos: {
                    select: {
                        model: {
                            select: {
                                models_id: true,
                                models_name: true,
                                models_find_id: true,
                                models_img_url: true,
                            },
                        },
                    },
                },

                // Lotes de stock
                lotes: {
                    select: {
                        lote_id: true,
                        numero_lote: true,
                        cantidad: true,
                        fecha_ingreso: true,
                    },
                },
            },
        });

        if (!item) throw new NotFoundException('Ítem no encontrado');

        return {
            item_id: item.item_id,
            item_codigo_principal: item.item_codigo_principal,
            item_nombre: item.item_nombre,
            item_descripcion: item.item_descripcion,
            item_precio_unitario: Number(item.item_precio_unitario),

            tarifa_impuesto: {
                tarifa_codigo_sri: item.tarifaImpuesto.tarifa_codigo_sri,
                tarifa_porcentaje: Number(item.tarifaImpuesto.tarifa_porcentaje),
                tarifa_nombre: item.tarifaImpuesto.tarifa_nombre,
                tipo_impuesto: {
                    codigo_sri: item.tarifaImpuesto.tipoImpuesto.tipo_impuesto_codigo_sri,
                    nombre: item.tarifaImpuesto.tipoImpuesto.tipo_impuesto_nombre,
                },
            },

            // Aplanar la capa intermedia item_modelo → model
            modelos: item.modelos.map((im) => ({
                models_id: im.model.models_id,
                models_name: im.model.models_name,
                models_find_id: im.model.models_find_id,
                models_img_url: im.model.models_img_url,
            })),

            lotes: item.lotes.map((l) => ({
                lote_id: l.lote_id,
                numero_lote: l.numero_lote,
                cantidad: l.cantidad,
                fecha_ingreso: l.fecha_ingreso,
            })),
        };
    }

    async editItem(dto: EditItemBodyDto, user: JwtPayload): Promise<void> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException('Sin empresa asignada en el token');

        // ── Guard multi-tenant: obtener id y tipo de ítem para validar lógica de negocio ──
        const existing = await this.prisma.item.findFirst({
            where: {
                item_id: dto.id,
                empresa_id: empresaId,
            },
            select: {
                item_id: true,
                tipo_item_id: true, // ← Recuperamos el tipo para discriminar Producto vs Servicio
            },
        });

        if (!existing) throw new NotFoundException('Ítem no encontrado');

        await this.prisma.$transaction(async (tx) => {

            // ── 1. Actualizar campos del ítem ──────────────────────────────────
            await tx.item.update({
                where: { item_id: dto.id },
                data: {
                    item_nombre: dto.nombre.trim().toUpperCase(),
                    item_descripcion: dto.descripcion?.trim() ?? null,
                    item_precio_unitario: dto.precio_unitario,
                    tarifa_impuesto_id: dto.id_tarifa_impuesto,
                    // item_fecha_actualizacion se maneja automáticamente por Prisma (@updatedAt)
                },
            });

            // ── 2. Actualizar cantidad de lotes (SÓLO SI ES PRODUCTO [tipo_item_id === 1]) ──
            if (existing.tipo_item_id === 1 && dto.lotes && dto.lotes.length > 0) {
                await Promise.all(
                    dto.lotes.map((lote) =>
                        tx.itemLote.updateMany({
                            where: {
                                lote_id: lote.lote_id,
                                item_id: dto.id, // Seguridad: el lote debe pertenecer a este ítem
                            },
                            data: { cantidad: lote.cantidad },
                        }),
                    ),
                );
            }

            // ── 3. Sync modelos (agrega nuevos, elimina los que falten) ────────
            const actuales = await tx.itemModelo.findMany({
                where: { item_id: dto.id },
                select: { models_id: true },
            });

            const idsActuales = actuales.map((m) => m.models_id);
            const idsNuevos = dto.modelos_ids || []; // Fallback por seguridad si viene undefined

            const modelosAgregar = idsNuevos.filter((id) => !idsActuales.includes(id));
            const modelosEliminar = idsActuales.filter((id) => !idsNuevos.includes(id));

            // Agregar nuevos modelos
            if (modelosAgregar.length > 0) {
                await tx.itemModelo.createMany({
                    data: modelosAgregar.map((models_id) => ({
                        item_id: dto.id,
                        models_id,
                    })),
                    skipDuplicates: true,
                });
            }

            // Eliminar los que ya no están vinculados
            if (modelosEliminar.length > 0) {
                await tx.itemModelo.deleteMany({
                    where: {
                        item_id: dto.id,
                        models_id: { in: modelosEliminar },
                    },
                });
            }
        });
    }

    async findProductsIdName(
        dto: FindProductsIdNameBodyDto,
        user: JwtPayload,
    ): Promise<FindProductsIdNameResponseDto[]> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException('Sin empresa asignada en el token');

        const search = dto.search?.trim() ?? '';
        const hasSearch = search.length > 0;
        const isNumeric = hasSearch && /^\d+$/.test(search);
        const limit = hasSearch ? 200 : 50;

        // ── Filtro base compartido ───────────────────────────────────────────
        const textFilter: Prisma.ItemWhereInput = hasSearch
            ? isNumeric
                ? { item_codigo_auxiliar: search.padStart(6, '0') }
                : {
                    OR: [
                        { item_nombre: { contains: search, mode: 'insensitive' } },
                        {
                            modelos: {
                                some: {
                                    model: {
                                        OR: [
                                            { models_name: { contains: search, mode: 'insensitive' } },
                                            { brand: { brands_name: { contains: search, mode: 'insensitive' } } },
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                }
            : {};

        const baseItemWhere: Prisma.ItemWhereInput = {
            empresa_id: empresaId,
            item_activo: true,
            ...textFilter,
        };

        // ── 1. Productos (tipo_item_id = 1) → desde lotes ───────────────────
        // ── 2. Servicios (tipo_item_id = 2) → desde items directamente ──────
        const [lotes, servicios] = await Promise.all([

            this.prisma.itemLote.findMany({
                where: {
                    cantidad: { gt: 0 },       // solo lotes con stock disponible
                    item: {
                        ...baseItemWhere,
                        tipo_item_id: 1,         // solo PRODUCTOS
                    },
                },
                orderBy: { lote_id: 'desc' },
                take: limit,
                select: {
                    lote_id: true,
                    numero_lote: true,
                    cantidad: true,
                    item: {
                        select: {
                            item_codigo_principal: true,
                            item_nombre: true,
                            item_precio_unitario: true,
                            tarifa_impuesto_id: true,
                            modelos: {
                                select: {
                                    model: { select: { models_name: true } },
                                },
                            },
                        },
                    },
                },
            }),

            this.prisma.item.findMany({
                where: {
                    ...baseItemWhere,
                    tipo_item_id: 2,           // solo SERVICIOS
                },
                orderBy: { item_id: 'desc' },
                take: limit,
                select: {
                    item_id: true,
                    item_codigo_principal: true,
                    item_nombre: true,
                    item_precio_unitario: true,
                    tarifa_impuesto_id: true,
                    modelos: {
                        select: {
                            model: { select: { models_name: true } },
                        },
                    },
                },
            }),
        ]);

        // ── Mapear productos ─────────────────────────────────────────────────
        const productosResult: FindProductsIdNameResponseDto[] = lotes.map((l) => {
            const modelNames = [...new Set(l.item.modelos.map((im) => im.model.models_name))];
            const modelosPart = modelNames.length ? ` [${modelNames.join(', ')}]` : '';
            const precio = Number(l.item.item_precio_unitario);

            return {
                id: l.lote_id,
                name:
                    `${l.item.item_codigo_principal} - ` +
                    `${l.numero_lote} - ` +
                    `${l.item.item_nombre}` +
                    `${modelosPart}` +
                    ` (${l.cantidad}) ` +
                    ` $${precio.toFixed(2)}`,
                price: precio,
                stock: l.cantidad,         // número real de stock
                tax_percentage_id: l.item.tarifa_impuesto_id,
                es_servicio: false,
            };
        });

        // ── Mapear servicios ─────────────────────────────────────────────────
        const serviciosResult: FindProductsIdNameResponseDto[] = servicios.map((s) => {
            const modelNames = [...new Set(s.modelos.map((im) => im.model.models_name))];
            const modelosPart = modelNames.length ? ` [${modelNames.join(', ')}]` : '';
            const precio = Number(s.item_precio_unitario);

            return {
                id: s.item_id,
                name:
                    `${s.item_codigo_principal} - ` +
                    `${s.item_nombre}` +
                    `${modelosPart}` +
                    ` $${precio.toFixed(2)}`,           // sin stock ni lote en el label
                price: precio,
                stock: null,              // null = sin inventario (servicio)
                tax_percentage_id: s.tarifa_impuesto_id,
                es_servicio: true,
            };
        });

        // ── Combinar: servicios primero, luego productos por lote_id desc ────
        const data = await [...serviciosResult, ...productosResult];
        console.log(data)
        return data
    }

    async findItemsForPurchase(
        dto: FindItemsPurchaseBodyDto,
        user: JwtPayload,
    ): Promise<FindItemsPurchaseResponseDto[]> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const search = dto.search?.trim() ?? '';
        const hasSearch = search.length > 0;
        const isNumeric = hasSearch && /^\d+$/.test(search);

        const where: Prisma.ItemWhereInput = {
            empresa_id: empresaId,
            item_activo: true,
            tipo_item_id: 1,
            ...(hasSearch && {
                ...(isNumeric
                    ? { item_codigo_auxiliar: search.padStart(6, '0') }
                    : {
                        OR: [
                            { item_nombre: { contains: search, mode: 'insensitive' } },
                            {
                                modelos: {
                                    some: {
                                        model: {
                                            OR: [
                                                { models_name: { contains: search, mode: 'insensitive' } },
                                                { brand: { brands_name: { contains: search, mode: 'insensitive' } } },
                                            ],
                                        },
                                    },
                                },
                            },
                        ],
                    }),
            }),
        };

        const rows = await this.prisma.item.findMany({
            where,
            orderBy: { item_id: 'desc' },
            take: hasSearch ? 100 : 50,
            select: {
                item_id: true,
                item_codigo_principal: true,
                item_nombre: true,
                item_precio_unitario: true,
                modelos: {
                    select: {
                        model: {
                            select: {
                                models_name: true,
                                brand: { select: { brands_name: true } },
                            },
                        },
                    },
                },
            },
        });

        return rows.map((i) => {
            const marcas = [...new Set(i.modelos.map((m) => m.model.brand.brands_name))];
            const modelos = [...new Set(i.modelos.map((m) => m.model.models_name))];

            const marcasPart = marcas.length ? ` [${marcas.join(', ')}]` : '';
            const modelosPart = modelos.length ? ` (${modelos.join(', ')})` : '';

            return {
                id: i.item_id,
                name: `${i.item_codigo_principal} - ${i.item_nombre}${marcasPart}${modelosPart}`,
                precio_actual: Number(i.item_precio_unitario),
            };
        });
    }

}