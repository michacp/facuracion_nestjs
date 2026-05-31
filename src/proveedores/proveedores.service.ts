import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogosService } from '../catalogos/catalogos.service';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { SaveProveedorBodyDto } from './dto/request/save-proveedor-body.dto';
import type { FindProveedorBodyDto } from './dto/request/find-proveedor-body.dto';
import type { GetNewDataProveedorResponseDto } from './dto/response/get-new-data-proveedor-response.dto';
import type { SaveProveedorResponseDto } from './dto/response/save-proveedor-response.dto';
import type { FindProveedorResponseDto } from './dto/response/find-proveedor-response.dto';

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
}