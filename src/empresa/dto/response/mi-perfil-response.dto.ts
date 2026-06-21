import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MiPerfilResponseDto {
    @ApiProperty({ example: 1 })
    usuarios_id!: number;

    @ApiProperty({ example: 'admin.empresa' })
    username!: string;

    @ApiProperty({ example: 'Juan Pérez' })
    nombre!: string;

    @ApiProperty({ example: 'juan@empresa.com' })
    email!: string;

    @ApiProperty({ example: true })
    activo!: boolean;

    @ApiProperty({ example: 'ADMINISTRADOR' })
    rol!: string;

    @ApiPropertyOptional({ example: '001', nullable: true })
    cod_emisor!: string | null;

    @ApiProperty({ example: 'EMPRESA S.A.' })
    empresa_nombre!: string;
}