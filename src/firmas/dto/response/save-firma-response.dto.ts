import { ApiProperty } from '@nestjs/swagger';

export class SaveFirmaResponseDto {
    @ApiProperty({ example: 3 })
    firmas_id!: number;

    @ApiProperty({ example: '1abc2def3ghi' })
    driveFileId!: string;

    @ApiProperty({ example: '2022-01-01T00:00:00.000Z' })
    fechaEmision!: Date;

    @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
    fechaExpiracion!: Date;
}