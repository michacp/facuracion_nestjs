import { ApiProperty } from '@nestjs/swagger';
import { IvaVentaDetalleDto, IvaCompraDetalleDto } from './reporte-iva-response.dto';

export class ListIvaVentasResponseDto {
    @ApiProperty({ example: 230 })
    total!: number;

    @ApiProperty({ type: [IvaVentaDetalleDto] })
    detalle!: IvaVentaDetalleDto[];
}

export class ListIvaComprasResponseDto {
    @ApiProperty({ example: 45 })
    total!: number;

    @ApiProperty({ type: [IvaCompraDetalleDto] })
    detalle!: IvaCompraDetalleDto[];
}