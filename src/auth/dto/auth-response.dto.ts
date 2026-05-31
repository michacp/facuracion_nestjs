import { ApiProperty } from '@nestjs/swagger';

class EmpresaResponse {
    @ApiProperty()
    id!: number;

    @ApiProperty()
    razonSocial!: string;

    @ApiProperty()
    nombreComercial!: string;
}

class UserResponse {
    @ApiProperty()
    id!: number;

    @ApiProperty()
    username!: string;

    @ApiProperty()
    email!: string;

    @ApiProperty()
    nombre!: string;

    @ApiProperty({ type: () => EmpresaResponse, nullable: true })
    empresa!: EmpresaResponse | null;

    @ApiProperty()
    rol!: string | null;

    @ApiProperty()
    plan!: string | null;

    @ApiProperty()
    suscripcionEstado!: string | null;
}

export class AuthResponseDto {
    @ApiProperty({ description: 'Token JWT para usar en las peticiones bearer' })
    access_token!: string;

    @ApiProperty({ type: () => UserResponse })
    user!: UserResponse;
}