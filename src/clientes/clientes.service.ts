import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogosService } from '../catalogos/catalogos.service';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { SaveClientBodyDto } from './dto/request/save-client-body.dto';
import type { FindClientBodyDto } from './dto/request/find-client-body.dto';
import type { TipoIdentificacionDto } from './dto/response/get-new-data-client-response.dto';
import type { SaveClientResponseDto } from './dto/response/save-client-response.dto';
import type { FindClientResponseDto } from './dto/response/find-client-response.dto';
import { DeleteClientBodyDto } from './dto/request/delete-client-body.dto';
import { EditClientBodyDto } from './dto/request/edit-client-body.dto';
import { ListClientesBodyDto } from './dto/request/list-clientes-body.dto';
import { ListClientesResponseDto } from './dto/response/list-clientes-response.dto';
import { Prisma } from '@prisma/client';
import { GetClienteBodyDto } from './dto/request/get-cliente-body.dto';
import { GetClienteResponseDto } from './dto/response/get-cliente-response.dto';

@Injectable()
export class ClientesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly catalogosService: CatalogosService,
    ) { }

    // ── GET getnewdata ───────────────────────────────────────────────────
    async getNewData(): Promise<TipoIdentificacionDto[]> {
        return this.catalogosService.getTiposIdentificacion();
    }

    // ── POST save ────────────────────────────────────────────────────────
    async save(dto: SaveClientBodyDto, user: JwtPayload): Promise<SaveClientResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException('Sin empresa asignada en el token');

        // Verificar duplicado activo
        const existing = await this.prisma.cliente.findFirst({
            where: {
                empresa_id: empresaId,
                identificacion: dto.identificacion,
                deleted_at: null, // ← ignorar eliminados
            },
            select: { id: true },
        });

        if (existing) {
            throw new ConflictException(
                `Ya existe un cliente con la identificación ${dto.identificacion}`,
            );
        }

        const cliente = await this.prisma.cliente.create({
            data: {
                empresa_id: empresaId,
                identificacion: dto.identificacion,
                tipo_identificacion: dto.tipoIdentificacion,
                razon_social: dto.razonSocial.trim().toUpperCase(),
                direccion: dto.direccion?.trim() ?? null,
                email: dto.email?.trim() ?? null,
                telefono: dto.telefono?.trim() ?? null,

                // Campos adicionales opcionales en la misma transacción
                camposAdicionales: dto.camposAdicionales?.length
                    ? {
                        createMany: {
                            data: dto.camposAdicionales.map((c) => ({
                                empresa_id: empresaId, // requerido por el schema
                                clave: c.clave.trim(),
                                valor: c.valor.trim(),
                            })),
                        },
                    }
                    : undefined,
            },
            select: {
                id: true,
                identificacion: true,
                razon_social: true,
                camposAdicionales: {
                    select: { clave: true, valor: true },
                },
            },
        });

        return {
            id: cliente.id,
            name: `${cliente.identificacion} - ${cliente.razon_social}`,
            camposAdicionales: cliente.camposAdicionales,
        };
    }

    // ── POST edit ────────────────────────────────────────────────────────
    async edit(dto: EditClientBodyDto, user: JwtPayload): Promise<void> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException('Sin empresa asignada en el token');

        // Guard multi-tenant + soft delete
        const existing = await this.prisma.cliente.findFirst({
            where: {
                id: dto.id,
                empresa_id: empresaId,
                deleted_at: null,
            },
            select: { id: true },
        });

        if (!existing) throw new NotFoundException('Cliente no encontrado');

        await this.prisma.$transaction(async (tx) => {

            // 1. Actualizar datos del cliente
            await tx.cliente.update({
                where: { id: dto.id },
                data: {
                    razon_social: dto.razonSocial.trim().toUpperCase(),
                    direccion: dto.direccion?.trim() ?? null,
                    email: dto.email?.trim() ?? null,
                    telefono: dto.telefono?.trim() ?? null,
                },
            });

            // 2. Sync campos adicionales — reemplaza todos
            if (dto.camposAdicionales !== undefined) {

                // Eliminar todos los actuales
                await tx.clienteCampoAdicional.deleteMany({
                    where: { cliente_id: dto.id },
                });

                // Insertar los nuevos si hay
                if (dto.camposAdicionales.length > 0) {
                    await tx.clienteCampoAdicional.createMany({
                        data: dto.camposAdicionales.map((c) => ({
                            empresa_id: empresaId,
                            cliente_id: dto.id,
                            clave: c.clave.trim(),
                            valor: c.valor.trim(),
                        })),
                    });
                }
            }
        });
    }

    // ── POST delete (soft) ───────────────────────────────────────────────
    async remove(dto: DeleteClientBodyDto, user: JwtPayload): Promise<void> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException('Sin empresa asignada en el token');

        const existing = await this.prisma.cliente.findFirst({
            where: {
                id: dto.id,
                empresa_id: empresaId,
                deleted_at: null,
            },
            select: { id: true },
        });

        if (!existing) throw new NotFoundException('Cliente no encontrado');

        await this.prisma.cliente.update({
            where: { id: dto.id },
            data: { deleted_at: new Date() }, // ← soft delete
        });
    }

    // ── POST find ────────────────────────────────────────────────────────
    async find(dto: FindClientBodyDto, user: JwtPayload): Promise<FindClientResponseDto[]> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException('Sin empresa asignada en el token');

        const term = dto.search.trim();

        const rows = await this.prisma.cliente.findMany({
            where: {
                empresa_id: empresaId,
                deleted_at: null,           // ← excluir eliminados
                OR: [
                    { identificacion: { contains: term, mode: 'insensitive' } },
                    { razon_social: { contains: term, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                identificacion: true,
                razon_social: true,
            },
            orderBy: { razon_social: 'asc' },
            take: 20,
        });

        return rows.map((c) => ({
            id: c.id,
            name: `${c.identificacion} - ${c.razon_social}`,
        }));
    }

    async listClientes(
        dto: ListClientesBodyDto,
        user: JwtPayload,
    ): Promise<ListClientesResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const { search, page = 0, limit = 30 } = dto;

        const palabras = search
            ?.trim()
            .split(/\s+/)
            .filter((p) => p.length > 0)
            ?? [];

        const andConditions: Prisma.ClienteWhereInput[] = palabras.map((palabra) => ({
            OR: [
                { razon_social: { contains: palabra, mode: 'insensitive' } },
                { identificacion: { contains: palabra, mode: 'insensitive' } },
                {
                    tipoIdentificacion: {
                        descripcion: { contains: palabra, mode: 'insensitive' },
                    },
                },
            ],
        }));

        const where: Prisma.ClienteWhereInput = {
            empresa_id: empresaId,
            deleted_at: null,
            ...(andConditions.length > 0 && { AND: andConditions }),
        };

        const [total, rows] = await Promise.all([
            this.prisma.cliente.count({ where }),
            this.prisma.cliente.findMany({
                where,
                orderBy: { razon_social: 'asc' },
                skip: page * limit,
                take: limit,
                select: {
                    id: true,
                    razon_social: true,
                    identificacion: true,
                    email: true,
                    telefono: true,
                    direccion: true,
                    tipoIdentificacion: {
                        select: { descripcion: true }, // ← el nombre, no el código
                    },
                },
            }),
        ]);

        return {
            total,
            clientes: rows.map((c) => ({
                id: c.id,
                razon_social: c.razon_social,
                identificacion: c.identificacion,
                tipo_identificacion: c.tipoIdentificacion.descripcion, // ← nombre legible
                email: c.email,
                telefono: c.telefono,
                direccion: c.direccion,
            })),
        };
    }
    async getCliente(
        dto: GetClienteBodyDto,
        user: JwtPayload,
    ): Promise<GetClienteResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const cliente = await this.prisma.cliente.findFirst({
            where: {
                id: dto.id,
                empresa_id: empresaId,
                deleted_at: null,
            },
            select: {
                id: true,
                identificacion: true,
                razon_social: true,
                direccion: true,
                email: true,
                telefono: true,
                es_consumidor_final: true,
                tipoIdentificacion: {
                    select: { codigo: true, descripcion: true },
                },
                camposAdicionales: {
                    select: { clave: true, valor: true },
                    orderBy: { clave: 'asc' },
                },
            },
        });

        if (!cliente) throw new NotFoundException('Cliente no encontrado');

        return {
            id: cliente.id,
            identificacion: cliente.identificacion,
            tipo_identificacion: cliente.tipoIdentificacion.codigo,
            tipo_identificacion_nombre: cliente.tipoIdentificacion.descripcion,
            razon_social: cliente.razon_social,
            direccion: cliente.direccion,
            email: cliente.email,
            telefono: cliente.telefono,
            es_consumidor_final: cliente.es_consumidor_final,
            camposAdicionales: cliente.camposAdicionales.map((c) => ({
                clave: c.clave,
                valor: c.valor,
            })),
        };
    }
}