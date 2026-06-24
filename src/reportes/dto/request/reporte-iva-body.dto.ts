import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReporteIvaBodyDto {
    @ApiProperty({ example: 6, description: 'Mes 1-12' })
    @IsInt()
    @Min(1)
    @Max(12)
    @Type(() => Number)
    mes!: number;

    @ApiProperty({ example: 2026 })
    @IsInt()
    @Min(2000)
    @Type(() => Number)
    anio!: number;
}