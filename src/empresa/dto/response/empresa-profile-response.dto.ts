import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SucursalDto {
    @ApiProperty({ example: 1 })
    sucursales_id!: number;

    @ApiProperty({ example: '001' })
    sucursales_cod!: string;

    @ApiProperty({ example: 'MATRIZ' })
    sucursales_nombre!: string;

    @ApiProperty({ example: 'Av. Principal 123' })
    sucursales_direccion!: string;

    @ApiPropertyOptional({ example: '0991234567', nullable: true })
    sucursales_telefono!: string | null;

    @ApiProperty({ example: true })
    sucursales_esMatriz!: boolean;
}

export class UsuarioEmpresaDto {
    @ApiProperty({ example: 1 })
    usuario_empresa_id!: number;

    @ApiProperty({ example: 1 })
    usuarios_id!: number;

    @ApiProperty({ example: 'admin.empresa' })
    username!: string;

    @ApiProperty({ example: 'Juan Pérez' })
    nombre!: string;

    @ApiProperty({ example: 'juan@empresa.com' })
    email!: string;

    @ApiProperty({ example: 'ADMIN' })
    rol!: string;

    @ApiProperty({ example: '001' })
    cod_emisor!: string;

    @ApiProperty({ example: true })
    activo!: boolean;
}

export class FirmaDto {
    @ApiProperty({ example: 1 })
    firmas_id!: number;

    @ApiPropertyOptional({ example: 'firma_empresa.p12', nullable: true })
    firmas_alias!: string | null;

    @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z', nullable: true })
    firmas_fechaEmision!: Date | null;

    @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z', nullable: true })
    firmas_fechaExpiracion!: Date | null;

    @ApiProperty({ example: true })
    firmas_activa!: boolean;

    @ApiProperty({ example: 15, description: 'Días restantes para expirar' })
    dias_restantes!: number | null;
}

export class SuscripcionDto {
    @ApiProperty({ example: 'OWNED' })
    plan_nombre!: string;

    @ApiProperty({ example: 'ACTIVA' })
    estado!: string;

    @ApiProperty({ example: '2026-12-31T00:00:00.000Z' })
    fecha_vencimiento!: Date;

    @ApiProperty({ example: 10 })
    max_usuarios!: number;

    @ApiProperty({ example: 3 })
    max_sucursales!: number;
}

export class EmpresaProfileResponseDto {
    // ── Datos de la empresa ─────────────────────────────────────────────
    @ApiProperty({ example: 1 })
    empresas_id!: number;

    @ApiProperty({ example: 'EMPRESA S.A.' })
    empresas_razonSocial!: string;

    @ApiPropertyOptional({ example: 'EMPRESA', nullable: true })
    empresas_nombreComercial!: string | null;

    @ApiProperty({ example: '0912345678001' })
    empresas_ruc!: string;

    @ApiProperty({ example: 'Av. Principal 123' })
    empresas_dirMatriz!: string;

    @ApiPropertyOptional({ example: '0991234567', nullable: true })
    empresas_telefono!: string | null;

    @ApiProperty({ example: 'empresa@mail.com' })
    empresa_email!: string;

    @ApiProperty({ example: false })
    empresas_obligadocontabilidad!: boolean;

    @ApiProperty({ example: false })
    empresas_agenteRetencion!: boolean;

    @ApiPropertyOptional({ example: 1, nullable: true })
    empresas_regimenes_id!: number | null;

    // ── Relaciones ───────────────────────────────────────────────────────
    @ApiProperty({ type: SuscripcionDto })
    suscripcion!: SuscripcionDto;

    @ApiProperty({ type: [SucursalDto] })
    sucursales!: SucursalDto[];

    @ApiProperty({ type: [UsuarioEmpresaDto] })
    usuarios!: UsuarioEmpresaDto[];

    @ApiProperty({ type: FirmaDto, nullable: true })
    firma!: FirmaDto | null;

    // ── Initial data para selects ────────────────────────────────────────
    @ApiProperty({ type: [Object], description: '[{ id, name }] regímenes disponibles' })
    regimenes!: { id: number; name: string }[];
}