import { ApiProperty } from '@nestjs/swagger';

export class PdfResponseDto {
    @ApiProperty({ description: 'PDF en base64', example: 'JVBERi0xLjQ...' })
    base64!: string;
}