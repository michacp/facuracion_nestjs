import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PdfService } from './pdf.service';
import { Auth, CurrentUser } from '../auth/decorators';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PrintSaleBodyDto } from './dto/request/print-sale-body.dto';
import { TicketPdfDoc } from './docs/ticket-pdf.doc';
import { A4PdfDoc } from './docs/a4-pdf.doc';
import type { PdfResponseDto } from './dto/response/pdf-response.dto';

@ApiTags('PDF')
@Controller('pdf')   // ← mantiene compatibilidad con ruta legacy /sales/ticket-pdf
export class PdfController {
  constructor(private readonly pdfService: PdfService) { }

  // Legacy: POST /sales/ticket-pdf
  @Post('ticket-pdf')
  @Auth()
  @TicketPdfDoc()
  async ticketPDF(
    @Body() body: any,
    @CurrentUser() user: JwtPayload,
  ): Promise<PdfResponseDto> {

    return this.pdfService.ticketPDF(body, user);
  }

  // Nuevo: POST /sales/a4-pdf
  @Post('a4-pdf')
  @Auth()
  @A4PdfDoc()
  async a4PDF(
    @Body() body: PrintSaleBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PdfResponseDto> {
    return this.pdfService.a4PDF(body, user);
  }
}