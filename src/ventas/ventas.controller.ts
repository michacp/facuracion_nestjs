import { Body, Controller, Get, Post } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { Auth, CurrentUser } from '../auth/decorators';
import { GetNewDataSalesDoc } from './docs/get-new-data-sales.doc';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { GetNewDataSalesResponseDto } from './dto/response/get-new-data-sales-response.dto';
import { ApiTags } from '@nestjs/swagger';
import { SaveSaleDoc } from './docs/save-sale.doc';
import { SaveSaleBodyDto } from './dto/request/save-sale-body.dto';
import { SaveSaleResponseDto } from './dto/response/save-sale-response.dto';
import { Get5LastSalesDoc } from './docs/get5-last-sales.doc';
import { Get5LastSalesResponseDto } from './dto/response/get5-last-sales-response.dto';
import { ListSalesDoc } from './docs/list-sales.doc';
import { ListSalesBodyDto } from './dto/request/list-sales-body.dto';
import { ListSalesResponseDto } from './dto/response/list-sales-response.dto';

@ApiTags('Ventas')
@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) { }
  @Get('getnewdata')
  @Auth()
  @GetNewDataSalesDoc()
  async getNewData(
    @CurrentUser() user: JwtPayload,
  ): Promise<GetNewDataSalesResponseDto> {
    return this.ventasService.getNewData(user);
  }

  @Post('save')
  @Auth()
  @SaveSaleDoc()
  async save(
    @Body() body: SaveSaleBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SaveSaleResponseDto> {
    return this.ventasService.save(body, user);
  }
  @Get('get5lastsales')
  @Auth()
  @Get5LastSalesDoc()
  async get5LastSales(
    @CurrentUser() user: JwtPayload,
  ): Promise<Get5LastSalesResponseDto[]> {

    return this.ventasService.get5LastSales(user);
  }

  @Post('list')
  @Auth()
  @ListSalesDoc()
  async list(
    @Body() body: ListSalesBodyDto, // ← tipado correctamente en vez de any
    @CurrentUser() user: JwtPayload,
  ): Promise<ListSalesResponseDto> {
    return this.ventasService.listSales(body, user);
  }
}
