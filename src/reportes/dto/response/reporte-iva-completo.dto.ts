import { ReporteIvaResponseDto } from './reporte-iva-response.dto';
import { IvaVentaDetalleDto, IvaCompraDetalleDto } from './reporte-iva-response.dto';

/**
 * Extiende el resumen con el detalle completo (sin paginar).
 * Usado SOLO internamente para generar Excel/PDF — no se expone como response de un endpoint JSON.
 */
export interface ReporteIvaCompletoDto extends ReporteIvaResponseDto {
    detalle_ventas: IvaVentaDetalleDto[];
    detalle_compras: IvaCompraDetalleDto[];
}