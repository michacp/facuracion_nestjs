import { ApiProperty } from '@nestjs/swagger';

export class GetNewDataComprasResponseDto {
    @ApiProperty({ type: [Object], description: '[{ id, name }] tipos de documento' })
    tiposDocumento!: { id: number; name: string }[];

    @ApiProperty({ type: [Object], description: '[{ id, name }] estados de pago' })
    estadosPago!: { id: number; name: string }[];

    @ApiProperty({ type: [Object], description: '[{ id, name }] tipos de identificación SRI' })
    tiposIdentificacion!: { id: string; name: string }[];

    @ApiProperty({ type: [Object], description: '[{ id, name }] países' })
    paises!: { id: number; name: string }[];
}