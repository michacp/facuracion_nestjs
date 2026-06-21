import {
    Injectable, UnauthorizedException,
    NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { EmpresaProfileResponseDto } from './dto/response/empresa-profile-response.dto';
import type { UpdateEmpresaBodyDto } from './dto/request/update-empresa-body.dto';
import type { SaveSucursalBodyDto } from './dto/request/save-sucursal-body.dto';
import type { SaveUsuarioEmpresaBodyDto } from './dto/request/save-usuario-empresa-body.dto';
import { DeleteSucursalBodyDto } from './dto/request/delete-sucursal-body.dto';
import { DeleteUsuarioEmpresaBodyDto } from './dto/request/delete-usuario-empresa-body.dto';
import { CambiarPasswordBodyDto } from './dto/request/cambiar-password-body.dto';
import { UpdateMiPerfilBodyDto } from './dto/request/update-mi-perfil-body.dto';
import { MiPerfilResponseDto } from './dto/response/mi-perfil-response.dto';

@Injectable()
export class EmpresaService {
    constructor(private readonly prisma: PrismaService) { }

    // ── GET profile ───────────────────────────────────────────────────────
    async getProfile(user: JwtPayload): Promise<EmpresaProfileResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const [empresa, regimenes] = await Promise.all([
            this.prisma.empresa.findUniqueOrThrow({
                where: { empresas_id: empresaId },
                select: {
                    empresas_id: true,
                    empresas_razonSocial: true,
                    empresas_nombreComercial: true,
                    empresas_ruc: true,
                    empresas_dirMatriz: true,
                    empresas_telefono: true,
                    empresa_email: true,
                    empresas_obligadocontabilidad: true,
                    empresas_agenteRetencion: true,
                    empresas_regimenes_id: true,
                    // Suscripción
                    suscripcion: {
                        select: {
                            estado: true,
                            fecha_vencimiento: true,
                            plan: {
                                select: {
                                    plan_nombre: true,
                                    max_usuarios: true,
                                    max_sucursales: true,
                                },
                            },
                        },
                    },
                    // Sucursales
                    sucursales: {
                        select: {
                            sucursales_id: true,
                            sucursales_cod: true,
                            sucursales_nombre: true,
                            sucursales_direccion: true,
                            sucursales_telefono: true,
                            sucursales_esMatriz: true,
                        },
                        orderBy: { sucursales_esMatriz: 'desc' },
                    },
                    // Usuarios con rol
                    usuarioEmpresas: {
                        where: { deleted_at: null },
                        select: {
                            usuario_empresa_id: true,
                            usuario_empresa_codEmi: true,
                            usuario: {
                                select: {
                                    usuarios_id: true,
                                    usuarios_username: true,
                                    usuarios_nombre: true,
                                    usuarios_email: true,
                                    usuarios_activo: true,
                                },
                            },
                            rol: {
                                select: { rol_nombre: true },
                            },
                        },
                    },
                    // Firma activa
                    firmas: {
                        where: { firmas_activa: true },
                        select: {
                            firmas_id: true,
                            firmas_alias: true,
                            firmas_fechaEmision: true,
                            firmas_fechaExpiracion: true,
                            firmas_activa: true,
                        },
                        take: 1,
                    },
                },
            }),

            this.prisma.regimen.findMany({
                select: { regimenes_id: true, regimenes_nombre: true },
                orderBy: { regimenes_nombre: 'asc' },
            }),
        ]);

        // Calcular días restantes de la firma
        const firmaActiva = empresa.firmas[0] ?? null;
        let diasRestantes: number | null = null;
        if (firmaActiva?.firmas_fechaExpiracion) {
            diasRestantes = Math.ceil(
                (new Date(firmaActiva.firmas_fechaExpiracion).getTime() - Date.now())
                / (1000 * 60 * 60 * 24),
            );
        }

        return {
            empresas_id: empresa.empresas_id,
            empresas_razonSocial: empresa.empresas_razonSocial,
            empresas_nombreComercial: empresa.empresas_nombreComercial,
            empresas_ruc: empresa.empresas_ruc,
            empresas_dirMatriz: empresa.empresas_dirMatriz,
            empresas_telefono: empresa.empresas_telefono,
            empresa_email: empresa.empresa_email,
            empresas_obligadocontabilidad: empresa.empresas_obligadocontabilidad,
            empresas_agenteRetencion: empresa.empresas_agenteRetencion,
            empresas_regimenes_id: empresa.empresas_regimenes_id,

            suscripcion: {
                plan_nombre: empresa.suscripcion!.plan.plan_nombre,
                estado: empresa.suscripcion!.estado,
                fecha_vencimiento: empresa.suscripcion!.fecha_vencimiento,
                max_usuarios: empresa.suscripcion!.plan.max_usuarios,
                max_sucursales: empresa.suscripcion!.plan.max_sucursales,
            },

            sucursales: empresa.sucursales.map((s) => ({
                sucursales_id: s.sucursales_id,
                sucursales_cod: s.sucursales_cod,
                sucursales_nombre: s.sucursales_nombre,
                sucursales_direccion: s.sucursales_direccion,
                sucursales_telefono: s.sucursales_telefono,
                sucursales_esMatriz: s.sucursales_esMatriz,
            })),

            usuarios: empresa.usuarioEmpresas.map((ue) => ({
                usuario_empresa_id: ue.usuario_empresa_id,
                usuarios_id: ue.usuario.usuarios_id,
                username: ue.usuario.usuarios_username,
                nombre: ue.usuario.usuarios_nombre,
                email: ue.usuario.usuarios_email,
                rol: ue.rol.rol_nombre,
                cod_emisor: ue.usuario_empresa_codEmi,
                activo: ue.usuario.usuarios_activo,
            })),

            firma: firmaActiva
                ? {
                    firmas_id: firmaActiva.firmas_id,
                    firmas_alias: firmaActiva.firmas_alias,
                    firmas_fechaEmision: firmaActiva.firmas_fechaEmision,
                    firmas_fechaExpiracion: firmaActiva.firmas_fechaExpiracion,
                    firmas_activa: firmaActiva.firmas_activa,
                    dias_restantes: diasRestantes,
                }
                : null,

            regimenes: regimenes.map((r) => ({
                id: r.regimenes_id,
                name: r.regimenes_nombre,
            })),
        };
    }

    // ── POST update empresa ───────────────────────────────────────────────
    async updateEmpresa(
        dto: UpdateEmpresaBodyDto,
        user: JwtPayload,
    ): Promise<void> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        // Verificar email duplicado si se cambia
        if (dto.empresa_email) {
            const emailExiste = await this.prisma.empresa.findFirst({
                where: {
                    empresa_email: dto.empresa_email,
                    empresas_id: { not: empresaId },
                },
                select: { empresas_id: true },
            });
            if (emailExiste) {
                throw new ConflictException('El email ya está en uso por otra empresa');
            }
        }

        // Filtrar solo los campos enviados (sin undefined)
        const data: any = {};
        if (dto.empresas_razonSocial !== undefined) data.empresas_razonSocial = dto.empresas_razonSocial.trim().toUpperCase();
        if (dto.empresas_nombreComercial !== undefined) data.empresas_nombreComercial = dto.empresas_nombreComercial?.trim().toUpperCase() ?? null;
        if (dto.empresas_dirMatriz !== undefined) data.empresas_dirMatriz = dto.empresas_dirMatriz.trim();
        if (dto.empresas_telefono !== undefined) data.empresas_telefono = dto.empresas_telefono?.trim() ?? null;
        if (dto.empresa_email !== undefined) data.empresa_email = dto.empresa_email.trim().toLowerCase();
        if (dto.empresas_obligadocontabilidad !== undefined) data.empresas_obligadocontabilidad = dto.empresas_obligadocontabilidad;
        if (dto.empresas_agenteRetencion !== undefined) data.empresas_agenteRetencion = dto.empresas_agenteRetencion;
        if (dto.empresas_regimenes_id !== undefined) data.empresas_regimenes_id = dto.empresas_regimenes_id;

        await this.prisma.empresa.update({
            where: { empresas_id: empresaId },
            data,
        });
    }

    // ── POST save sucursal ────────────────────────────────────────────────
    async saveSucursal(
        dto: SaveSucursalBodyDto,
        user: JwtPayload,
    ): Promise<void> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        // Verificar límite del plan (solo al crear)
        if (!dto.sucursales_id) {
            const suscripcion = await this.prisma.suscripcion.findFirst({
                where: { empresa_id: empresaId },
                select: { plan: { select: { max_sucursales: true } } },
            });

            const maxSucursales = suscripcion?.plan.max_sucursales ?? 1;

            // -1 = ilimitado, se omite la validación
            if (maxSucursales !== -1) {
                const totalActual = await this.prisma.sucursal.count({
                    where: { sucursales_empresaId: empresaId },
                });

                if (totalActual >= maxSucursales) {
                    throw new BadRequestException(
                        `El plan actual permite máximo ${maxSucursales} sucursal(es). ` +
                        `Actualiza tu plan para agregar más.`,
                    );
                }
            }
        }

        // Verificar código duplicado
        const codExiste = await this.prisma.sucursal.findFirst({
            where: {
                sucursales_empresaId: empresaId,
                sucursales_cod: dto.sucursales_cod,
                ...(dto.sucursales_id && { sucursales_id: { not: dto.sucursales_id } }),
            },
        });
        if (codExiste) throw new ConflictException(`El código ${dto.sucursales_cod} ya existe`);

        if (dto.sucursales_id) {
            // Editar — validar que pertenece a la empresa
            const existe = await this.prisma.sucursal.findFirst({
                where: { sucursales_id: dto.sucursales_id, sucursales_empresaId: empresaId },
            });
            if (!existe) throw new NotFoundException('Sucursal no encontrada');

            await this.prisma.sucursal.update({
                where: { sucursales_id: dto.sucursales_id },
                data: {
                    sucursales_cod: dto.sucursales_cod,
                    sucursales_nombre: dto.sucursales_nombre.trim().toUpperCase(),
                    sucursales_direccion: dto.sucursales_direccion.trim(),
                    sucursales_telefono: dto.sucursales_telefono?.trim() ?? null,
                },
            });
        } else {
            // Crear
            await this.prisma.sucursal.create({
                data: {
                    sucursales_empresaId: empresaId,
                    sucursales_cod: dto.sucursales_cod,
                    sucursales_nombre: dto.sucursales_nombre.trim().toUpperCase(),
                    sucursales_direccion: dto.sucursales_direccion.trim(),
                    sucursales_telefono: dto.sucursales_telefono?.trim() ?? null,
                    sucursales_esMatriz: false, // solo puede haber una matriz
                },
            });
        }
    }

    // ── POST save usuario ─────────────────────────────────────────────────
    async saveUsuario(
        dto: SaveUsuarioEmpresaBodyDto,
        user: JwtPayload,
    ): Promise<void> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        if (dto.usuario_empresa_id) {
            // ── Editar vínculo existente (rol, cod_emisor) ──────────────────
            const ue = await this.prisma.usuarioEmpresa.findFirst({
                where: {
                    usuario_empresa_id: dto.usuario_empresa_id,
                    usuario_empresa_empresaId: empresaId,
                },
            });
            if (!ue) throw new NotFoundException('Vínculo usuario-empresa no encontrado');

            await this.prisma.usuarioEmpresa.update({
                where: { usuario_empresa_id: dto.usuario_empresa_id },
                data: {
                    usuario_empresa_rolId: dto.rol_id,
                    usuario_empresa_codEmi: dto.cod_emisor,
                },
            });

        } else {
            // ── Crear nuevo usuario y vincularlo ────────────────────────────

            // Verificar límite del plan
            const suscripcion = await this.prisma.suscripcion.findFirst({
                where: { empresa_id: empresaId },
                select: { plan: { select: { max_usuarios: true } } },
            });

            const maxUsuarios = suscripcion?.plan.max_usuarios ?? 1;

            // -1 = ilimitado, se omite la validación
            if (maxUsuarios !== -1) {
                const totalActual = await this.prisma.usuarioEmpresa.count({
                    where: { usuario_empresa_empresaId: empresaId },
                });

                if (totalActual >= maxUsuarios) {
                    throw new BadRequestException(
                        `El plan actual permite máximo ${maxUsuarios} usuario(s).`,
                    );
                }
            }

            if (!dto.password) {
                throw new BadRequestException('La contraseña es requerida para un nuevo usuario');
            }

            // Verificar username/email duplicados
            const userExiste = await this.prisma.usuario.findFirst({
                where: {
                    OR: [
                        { usuarios_username: dto.username },
                        { usuarios_email: dto.email },
                    ],
                },
            });
            if (userExiste) throw new ConflictException('El username o email ya está en uso');

            const hash = await bcrypt.hash(dto.password, 10);

            await this.prisma.$transaction(async (tx) => {
                const nuevoUsuario = await tx.usuario.create({
                    data: {
                        usuarios_username: dto.username.trim().toLowerCase(),
                        usuarios_nombre: dto.nombre.trim(),
                        usuarios_email: dto.email.trim().toLowerCase(),
                        usuarios_password: hash,
                        usuarios_activo: true,
                    },
                    select: { usuarios_id: true },
                });

                await tx.usuarioEmpresa.create({
                    data: {
                        usuario_empresa_usuarioId: nuevoUsuario.usuarios_id,
                        usuario_empresa_empresaId: empresaId,
                        usuario_empresa_rolId: dto.rol_id,
                        usuario_empresa_codEmi: dto.cod_emisor,
                    },
                });
            });
        }
    }

    // ── DELETE sucursal ───────────────────────────────────────────────────
    async deleteSucursal(
        dto: DeleteSucursalBodyDto,
        user: JwtPayload,
    ): Promise<void> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        // Validar que pertenece a la empresa
        const sucursal = await this.prisma.sucursal.findFirst({
            where: {
                sucursales_id: dto.sucursales_id,
                sucursales_empresaId: empresaId,
            },
            select: {
                sucursales_id: true,
                sucursales_esMatriz: true,
                sucursales_nombre: true,
            },
        });

        if (!sucursal) throw new NotFoundException('Sucursal no encontrada');

        // No se puede eliminar la MATRIZ
        if (sucursal.sucursales_esMatriz) {
            throw new BadRequestException(
                'No se puede eliminar la sucursal MATRIZ. ' +
                'Edita sus datos si necesitas cambiar la dirección principal.',
            );
        }

        // Debe quedar al menos una sucursal
        const totalSucursales = await this.prisma.sucursal.count({
            where: { sucursales_empresaId: empresaId },
        });

        if (totalSucursales <= 1) {
            throw new BadRequestException(
                'La empresa debe tener al menos una sucursal.',
            );
        }

        // Verificar que no tenga ventas o numeraciones asociadas
        const [ventasCount, numeracionCount] = await Promise.all([
            this.prisma.venta.count({
                where: { ventas_sucursales_id: dto.sucursales_id },
            }),
            this.prisma.facturaNumeracion.count({
                where: { sucursal_id: dto.sucursales_id },
            }),
        ]);

        if (ventasCount > 0 || numeracionCount > 0) {
            throw new BadRequestException(
                `No se puede eliminar la sucursal "${sucursal.sucursales_nombre}" ` +
                `porque tiene ${ventasCount} venta(s) y/o numeración de facturas asociadas. ` +
                `Si ya no la usas, puedes dejarla inactiva.`,
            );
        }

        await this.prisma.sucursal.delete({
            where: { sucursales_id: dto.sucursales_id },
        });
    }

    // ── DELETE usuario empresa (soft delete del vínculo) ──────────────────
    async deleteUsuarioEmpresa(
        dto: DeleteUsuarioEmpresaBodyDto,
        user: JwtPayload,
    ): Promise<void> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        // Obtener el vínculo con su rol
        const ue = await this.prisma.usuarioEmpresa.findFirst({
            where: {
                usuario_empresa_id: dto.usuario_empresa_id,
                usuario_empresa_empresaId: empresaId,
                deleted_at: null,
            },
            select: {
                usuario_empresa_id: true,
                usuario_empresa_usuarioId: true,
                rol: { select: { rol_nombre: true } },
            },
        });

        if (!ue) throw new NotFoundException('Usuario no encontrado en esta empresa');

        // No puede eliminarse a sí mismo
        if (ue.usuario_empresa_usuarioId === user.sub) {
            throw new BadRequestException('No puedes eliminar tu propio acceso');
        }

        // ── Validar mínimo de admins si el usuario es SUPERADMIN o ADMINISTRADOR
        const rolNombre = ue.rol.rol_nombre.toUpperCase();
        const esAdmin = rolNombre === 'SUPERADMIN' || rolNombre === 'ADMINISTRADOR';

        if (esAdmin) {
            // Contar cuántos SUPERADMIN + ADMINISTRADOR activos quedan
            const adminsActivos = await this.prisma.usuarioEmpresa.count({
                where: {
                    usuario_empresa_empresaId: empresaId,
                    deleted_at: null,
                    rol: {
                        rol_nombre: { in: ['SUPERADMIN', 'ADMINISTRADOR'] },
                    },
                },
            });

            if (adminsActivos <= 1) {
                throw new BadRequestException(
                    'No se puede eliminar el único administrador de la empresa. ' +
                    'Asigna el rol de administrador a otro usuario antes de continuar.',
                );
            }
        }

        // Soft delete del vínculo — el usuario global sigue existiendo
        await this.prisma.usuarioEmpresa.update({
            where: { usuario_empresa_id: dto.usuario_empresa_id },
            data: { deleted_at: new Date() },
        });
    }

    // ── Fix toggleUsuarioActivo — también verificar mínimo de admins ──────
    async toggleUsuarioActivo(
        usuarioEmpresaId: number,
        user: JwtPayload,
    ): Promise<void> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const ue = await this.prisma.usuarioEmpresa.findFirst({
            where: {
                usuario_empresa_id: usuarioEmpresaId,
                usuario_empresa_empresaId: empresaId,
                deleted_at: null,
            },
            select: {
                usuario_empresa_usuarioId: true,
                rol: { select: { rol_nombre: true } },
                usuario: {
                    select: { usuarios_id: true, usuarios_activo: true },
                },
            },
        });

        if (!ue) throw new NotFoundException('Usuario no encontrado en esta empresa');

        if (ue.usuario.usuarios_id === user.sub) {
            throw new BadRequestException('No puedes desactivar tu propio usuario');
        }

        // Si se va a DESACTIVAR un admin — verificar que quede al menos uno activo
        const vaADesactivar = ue.usuario.usuarios_activo;
        const esAdmin = ['SUPERADMIN', 'ADMINISTRADOR']
            .includes(ue.rol.rol_nombre.toUpperCase());

        if (vaADesactivar && esAdmin) {
            const adminsActivos = await this.prisma.usuarioEmpresa.count({
                where: {
                    usuario_empresa_empresaId: empresaId,
                    deleted_at: null,
                    rol: { rol_nombre: { in: ['SUPERADMIN', 'ADMINISTRADOR'] } },
                    usuario: { usuarios_activo: true },
                },
            });

            if (adminsActivos <= 1) {
                throw new BadRequestException(
                    'No se puede desactivar el único administrador activo de la empresa.',
                );
            }
        }

        await this.prisma.usuario.update({
            where: { usuarios_id: ue.usuario.usuarios_id },
            data: { usuarios_activo: !ue.usuario.usuarios_activo },
        });
    }
    // ── GET mi perfil ────────────────────────────────────────────────────
    async getMiPerfil(user: JwtPayload): Promise<MiPerfilResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const ue = await this.prisma.usuarioEmpresa.findFirst({
            where: {
                usuario_empresa_usuarioId: user.sub,
                usuario_empresa_empresaId: empresaId,
                deleted_at: null,
            },
            select: {
                usuario_empresa_codEmi: true,
                rol: { select: { rol_nombre: true } },
                empresa: { select: { empresas_razonSocial: true } },
                usuario: {
                    select: {
                        usuarios_id: true,
                        usuarios_username: true,
                        usuarios_nombre: true,
                        usuarios_email: true,
                        usuarios_activo: true,
                    },
                },
            },
        });

        if (!ue) throw new NotFoundException('Perfil no encontrado');

        return {
            usuarios_id: ue.usuario.usuarios_id,
            username: ue.usuario.usuarios_username,
            nombre: ue.usuario.usuarios_nombre,
            email: ue.usuario.usuarios_email,
            activo: ue.usuario.usuarios_activo,
            rol: ue.rol.rol_nombre,
            cod_emisor: ue.usuario_empresa_codEmi,
            empresa_nombre: ue.empresa.empresas_razonSocial,
        };
    }

    // ── POST actualizar mi perfil ───────────────────────────────────────
    async updateMiPerfil(
        dto: UpdateMiPerfilBodyDto,
        user: JwtPayload,
    ): Promise<void> {
        // Verificar email duplicado si se cambia
        if (dto.email) {
            const emailExiste = await this.prisma.usuario.findFirst({
                where: {
                    usuarios_email: dto.email.trim().toLowerCase(),
                    usuarios_id: { not: user.sub },
                },
                select: { usuarios_id: true },
            });
            if (emailExiste) {
                throw new ConflictException('El email ya está en uso por otro usuario');
            }
        }

        const data: any = {};
        if (dto.nombre !== undefined) data.usuarios_nombre = dto.nombre.trim();
        if (dto.email !== undefined) data.usuarios_email = dto.email.trim().toLowerCase();

        if (Object.keys(data).length === 0) return;

        await this.prisma.usuario.update({
            where: { usuarios_id: user.sub },
            data,
        });
    }

    // ── POST cambiar mi contraseña ──────────────────────────────────────
    async cambiarPassword(
        dto: CambiarPasswordBodyDto,
        user: JwtPayload,
    ): Promise<void> {
        const usuario = await this.prisma.usuario.findUniqueOrThrow({
            where: { usuarios_id: user.sub },
            select: { usuarios_password: true },
        });

        const passwordValida = await bcrypt.compare(
            dto.passwordActual,
            usuario.usuarios_password,
        );

        if (!passwordValida) {
            throw new BadRequestException('La contraseña actual no es correcta');
        }

        // Evitar que la nueva sea idéntica a la actual
        const esMismaPassword = await bcrypt.compare(
            dto.passwordNuevo,
            usuario.usuarios_password,
        );
        if (esMismaPassword) {
            throw new BadRequestException(
                'La nueva contraseña no puede ser igual a la actual',
            );
        }

        const hashNuevo = await bcrypt.hash(dto.passwordNuevo, 10);

        await this.prisma.usuario.update({
            where: { usuarios_id: user.sub },
            data: { usuarios_password: hashNuevo },
        });
    }

}