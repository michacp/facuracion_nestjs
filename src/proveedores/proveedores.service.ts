import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogosService } from '../catalogos/catalogos.service';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { SaveProveedorBodyDto } from './dto/request/save-proveedor-body.dto';
import type { FindProveedorBodyDto } from './dto/request/find-proveedor-body.dto';
import type { GetNewDataProveedorResponseDto } from './dto/response/get-new-data-proveedor-response.dto';
import type { SaveProveedorResponseDto } from './dto/response/save-proveedor-response.dto';
import type { FindProveedorResponseDto } from './dto/response/find-proveedor-response.dto';
import { ListProveedoresBodyDto } from './dto/request/list-proveedores-body.dto';
import { ListProveedoresResponseDto } from './dto/response/list-proveedores-response.dto';
import { Prisma } from '@prisma/client';
import { GetProveedorBodyDto } from './dto/request/get-proveedor-body.dto';
import { GetProveedorResponseDto } from './dto/response/get-proveedor-response.dto';
import { UpdateProveedorBodyDto } from './dto/request/update-proveedor-body.dto';
import { DeleteProveedorBodyDto } from './dto/request/delete-proveedor-body.dto';
import { DeleteProveedorResponseDto } from './dto/response/delete-proveedor-response.dto';

@Injectable()
export class ProveedoresService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly catalogosService: CatalogosService,
    ) { }

    // ── GET getnewdata ───────────────────────────────────────────────────
    async getNewData(): Promise<GetNewDataProveedorResponseDto> {
        const [tiposIdentificacion, paises] = await Promise.all([
            this.catalogosService.getTiposIdentificacion(),
            this.catalogosService.getPaises(),
        ]);
        return { tiposIdentificacion, paises };
    }

    // ── POST save ────────────────────────────────────────────────────────
    async save(
        dto: SaveProveedorBodyDto,
        user: JwtPayload,
    ): Promise<SaveProveedorResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException('Sin empresa asignada en el token');

        // Verificar duplicado activo dentro de la empresa
        const existing = await this.prisma.proveedor.findFirst({
            where: {
                empresa_id: empresaId,
                identificacion: dto.identificacion,
                deleted_at: null,
            },
            select: { proveedor_id: true },
        });

        if (existing) {
            throw new ConflictException(
                `Ya existe un proveedor con la identificación ${dto.identificacion}`,
            );
        }

        const proveedor = await this.prisma.proveedor.create({
            data: {
                empresa_id: empresaId,
                identificacion: dto.identificacion,
                tipo_identificacion: dto.tipoIdentificacion,
                razon_social: dto.razonSocial.trim().toUpperCase(),
                nombre_comercial: dto.nombreComercial?.trim().toUpperCase() ?? null,
                pais_id: dto.paisId,
                direccion: dto.direccion?.trim() ?? null,
                telefono: dto.telefono?.trim() ?? null,
                email: dto.email?.trim() ?? null,
            },
            select: {
                proveedor_id: true,
                identificacion: true,
                razon_social: true,
            },
        });

        return {
            id: proveedor.proveedor_id,
            name: `${proveedor.identificacion} - ${proveedor.razon_social}`,
        };
    }

    // ── POST find ────────────────────────────────────────────────────────
    // proveedores.service.ts — carga inicial si no hay search
    async find(dto: FindProveedorBodyDto, user: JwtPayload): Promise<FindProveedorResponseDto[]> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const term = dto.search?.trim() ?? '';
        const hasSearch = term.length > 0;

        const rows = await this.prisma.proveedor.findMany({
            where: {
                empresa_id: empresaId,
                deleted_at: null,
                ...(hasSearch
                    ? {
                        OR: [
                            { identificacion: { contains: term, mode: 'insensitive' } },
                            { razon_social: { contains: term, mode: 'insensitive' } },
                            { nombre_comercial: { contains: term, mode: 'insensitive' } },
                        ],
                    }
                    : {}), // sin filtro = trae los últimos 20
            },
            select: {
                proveedor_id: true,
                identificacion: true,
                razon_social: true,
            },
            orderBy: { proveedor_creadoEn: 'desc' }, // últimos ingresados primero
            take: hasSearch ? 30 : 20,            // 20 inicial, 30 buscando
        });

        return rows.map((p) => ({
            id: p.proveedor_id,
            name: `${p.identificacion} - ${p.razon_social}`,
        }));
    }

    // ── POST list ────────────────────────────────────────────────────────
    async listProveedores(
        dto: ListProveedoresBodyDto,
        user: JwtPayload,
    ): Promise<ListProveedoresResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const { search, page = 0, limit = 30 } = dto;

        const palabras = search
            ?.trim()
            .split(/\s+/)
            .filter((p) => p.length > 0)
            ?? [];

        const andConditions: Prisma.ProveedorWhereInput[] = palabras.map((palabra) => ({
            OR: [
                { razon_social: { contains: palabra, mode: 'insensitive' } },
                { nombre_comercial: { contains: palabra, mode: 'insensitive' } },
                { identificacion: { contains: palabra, mode: 'insensitive' } },
            ],
        }));

        const where: Prisma.ProveedorWhereInput = {
            empresa_id: empresaId,
            deleted_at: null,
            ...(andConditions.length > 0 && { AND: andConditions }),
        };

        const [total, rows] = await Promise.all([
            this.prisma.proveedor.count({ where }),
            this.prisma.proveedor.findMany({
                where,
                orderBy: { razon_social: 'asc' },
                skip: page * limit,
                take: limit,
                select: {
                    proveedor_id: true,
                    identificacion: true,
                    razon_social: true,
                    nombre_comercial: true,
                    email: true,
                    telefono: true,
                    tipoIdentificacion: { select: { descripcion: true } },
                    pais: { select: { nombre: true } },
                    _count: {
                        select: { compras: true },
                    },
                },
            }),
        ]);

        return {
            total,
            proveedores: rows.map((p) => ({
                proveedor_id: p.proveedor_id,
                identificacion: p.identificacion,
                tipo_identificacion_nombre: p.tipoIdentificacion.descripcion,
                razon_social: p.razon_social,
                nombre_comercial: p.nombre_comercial,
                pais: p.pais.nombre,
                email: p.email,
                telefono: p.telefono,
                total_compras: p._count.compras,
            })),
        };
    }

    // ── POST get ─────────────────────────────────────────────────────────
    async getProveedor(
        dto: GetProveedorBodyDto,
        user: JwtPayload,
    ): Promise<GetProveedorResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const proveedor = await this.prisma.proveedor.findFirst({
            where: {
                proveedor_id: dto.proveedor_id,
                empresa_id: empresaId,
                deleted_at: null,
            },
            select: {
                proveedor_id: true,
                identificacion: true,
                razon_social: true,
                nombre_comercial: true,
                direccion: true,
                telefono: true,
                email: true,
                tipoIdentificacion: { select: { codigo: true, descripcion: true } },
                pais: { select: { pais_id: true, nombre: true } },
            },
        });

        if (!proveedor) throw new NotFoundException('Proveedor no encontrado');

        return {
            proveedor_id: proveedor.proveedor_id,
            identificacion: proveedor.identificacion,
            tipo_identificacion: proveedor.tipoIdentificacion.codigo,
            tipo_identificacion_nombre: proveedor.tipoIdentificacion.descripcion,
            razon_social: proveedor.razon_social,
            nombre_comercial: proveedor.nombre_comercial,
            pais_id: proveedor.pais.pais_id,
            pais_nombre: proveedor.pais.nombre,
            direccion: proveedor.direccion,
            telefono: proveedor.telefono,
            email: proveedor.email,
        };
    }

    // ── POST update ──────────────────────────────────────────────────────
    async updateProveedor(
        dto: UpdateProveedorBodyDto,
        user: JwtPayload,
    ): Promise<SaveProveedorResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        // Validar que existe y pertenece a la empresa
        const existe = await this.prisma.proveedor.findFirst({
            where: {
                proveedor_id: dto.proveedor_id,
                empresa_id: empresaId,
                deleted_at: null,
            },
            select: { proveedor_id: true },
        });
        if (!existe) throw new NotFoundException('Proveedor no encontrado');

        // Verificar identificación duplicada con OTRO proveedor
        const duplicado = await this.prisma.proveedor.findFirst({
            where: {
                empresa_id: empresaId,
                identificacion: dto.identificacion,
                deleted_at: null,
                proveedor_id: { not: dto.proveedor_id },
            },
            select: { proveedor_id: true },
        });
        if (duplicado) {
            throw new ConflictException(
                `Ya existe otro proveedor con la identificación ${dto.identificacion}`,
            );
        }

        const proveedor = await this.prisma.proveedor.update({
            where: { proveedor_id: dto.proveedor_id },
            data: {
                identificacion: dto.identificacion,
                tipo_identificacion: dto.tipoIdentificacion,
                razon_social: dto.razonSocial.trim().toUpperCase(),
                nombre_comercial: dto.nombreComercial?.trim().toUpperCase() ?? null,
                pais_id: dto.paisId,
                direccion: dto.direccion?.trim() ?? null,
                telefono: dto.telefono?.trim() ?? null,
                email: dto.email?.trim() ?? null,
            },
            select: {
                proveedor_id: true,
                identificacion: true,
                razon_social: true,
            },
        });

        return {
            id: proveedor.proveedor_id,
            name: `${proveedor.identificacion} - ${proveedor.razon_social}`,
        };
    }

    // ── POST delete ──────────────────────────────────────────────────────
    async deleteProveedor(
        dto: DeleteProveedorBodyDto,
        user: JwtPayload,
    ): Promise<DeleteProveedorResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const proveedor = await this.prisma.proveedor.findFirst({
            where: {
                proveedor_id: dto.proveedor_id,
                empresa_id: empresaId,
                deleted_at: null,
            },
            select: {
                proveedor_id: true,
                _count: { select: { compras: true } },
            },
        });

        if (!proveedor) throw new NotFoundException('Proveedor no encontrado');

        const tieneCompras = proveedor._count.compras > 0;

        if (tieneCompras) {
            // ── Soft delete — preserva trazabilidad de compras ────────────────
            await this.prisma.proveedor.update({
                where: { proveedor_id: dto.proveedor_id },
                data: { deleted_at: new Date() },
            });

            return {
                success: true,
                mensaje: `Proveedor desactivado (tiene ${proveedor._count.compras} compra(s) registrada(s))`,
                soft_delete: true,
            };
        } else {
            // ── Eliminación permanente — sin registros asociados ──────────────
            await this.prisma.proveedor.delete({
                where: { proveedor_id: dto.proveedor_id },
            });

            return {
                success: true,
                mensaje: 'Proveedor eliminado permanentemente',
                soft_delete: false,
            };
        }
    }
}