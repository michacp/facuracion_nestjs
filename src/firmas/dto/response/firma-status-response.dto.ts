import { ApiProperty } from '@nestjs/swagger';

export class FirmaStatusResponseDto {
    @ApiProperty({ example: 3 })
    id!: number;

    @ApiProperty({ example: 1 })
    company_id!: number;

    @ApiProperty({ example: 'firma_empresa.p12' })
    alias!: string;

    @ApiProperty({ example: '2022-01-01T00:00:00.000Z' })
    issue_date!: Date;

    @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
    expiration_date!: Date;
}