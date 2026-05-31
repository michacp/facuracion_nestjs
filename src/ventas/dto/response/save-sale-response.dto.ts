import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenerateInvoiceResponseDto } from '../../../facturas/dto/response/generate-invoice-response.dto';

export class SaveSaleResponseDto {
    @ApiProperty({ example: true })
    success!: boolean;

    @ApiProperty({ example: 42 })
    ventaId!: number;

    @ApiProperty({ example: 'FAC-0000001' })
    numeroVenta!: string;

    @ApiPropertyOptional({ type: GenerateInvoiceResponseDto, nullable: true })
    facData?: GenerateInvoiceResponseDto;
}