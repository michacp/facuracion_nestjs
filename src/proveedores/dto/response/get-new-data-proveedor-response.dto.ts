import { ApiProperty } from '@nestjs/swagger';

// Reutiliza IdNameDto de catalogos-shared.dto.ts
export class GetNewDataProveedorResponseDto {
    @ApiProperty({ type: [Object], description: '[ { id, name } ] tipos de identificación' })
    tiposIdentificacion!: { id: string; name: string }[];

    @ApiProperty({ type: [Object], description: '[ { id, name } ] países' })
    paises!: { id: number; name: string }[];
}