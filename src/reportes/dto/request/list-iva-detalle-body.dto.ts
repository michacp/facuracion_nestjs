import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListIvaDetalleBodyDto {
    @ApiProperty({ example: 6 })
    @IsInt() @Min(1) @Max(12) @Type(() => Number)
    mes!: number;

    @ApiProperty({ example: 2026 })
    @IsInt() @Min(2000) @Type(() => Number)
    anio!: number;

    @ApiPropertyOptional({ example: 'JUAN' })
    @IsString() @IsOptional()
    search?: string;

    @ApiPropertyOptional({ example: 0, default: 0 })
    @IsInt() @Min(0) @IsOptional() @Type(() => Number)
    page?: number;

    @ApiPropertyOptional({ example: 30, default: 30 })
    @IsInt() @Min(1) @IsOptional() @Type(() => Number)
    limit?: number;
}