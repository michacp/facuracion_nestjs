import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ComprasService } from './compras.service';
import { Auth, CurrentUser } from '../auth/decorators';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { GetNewDataComprasDoc } from './docs/get-new-data-compras.doc';
import { SaveCompraDoc } from './docs/save-compra.doc';
import { SaveCompraBodyDto } from './dto/request/save-compra-body.dto';
import type { GetNewDataComprasResponseDto } from '../catalogos/dto/response/get-new-data-compras-response.dto';
import type { SaveCompraResponseDto } from './dto/response/save-compra-response.dto';
import { ListComprasDoc } from './docs/list-compras.doc';
import { ListComprasBodyDto } from './dto/request/list-compras-body.dto';
import { ListComprasResponseDto } from './dto/response/list-compras-response.dto';
import { GetCompraDoc } from './docs/get-compra.doc';
import { GetCompraBodyDto } from './dto/request/get-compra-body.dto';
import { GetCompraResponseDto } from './dto/response/get-compra-response.dto';
import { UpdateCompraFieldDoc } from './docs/update-compra-field.doc';
import { UpdateCompraFieldBodyDto } from './dto/request/update-compra-field-body.dto';
import { AddItemCompraResponseDto, RemoveItemCompraResponseDto, UpdateCompraResponseDto } from './dto/response/update-compra-response.dto';
import { AddItemCompraDoc } from './docs/add-item-compra.doc';
import { AddItemCompraBodyDto } from './dto/request/add-item-compra-body.dto';
import { RemoveItemCompraDoc } from './docs/remove-item-compra.doc';
import { RemoveItemCompraBodyDto } from './dto/request/remove-item-compra-body.dto';

@ApiTags('Compras / Ingreso de Mercadería')
@Controller('compras')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) { }

  @Get('getnewdata')
  @Auth()
  @GetNewDataComprasDoc()
  async getNewData(): Promise<GetNewDataComprasResponseDto> {
    return this.comprasService.getNewData();
  }

  @Post('save')
  @Auth()
  @SaveCompraDoc()
  async save(
    @Body() body: SaveCompraBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SaveCompraResponseDto> {
    return this.comprasService.save(body, user);
  }
  @Post('list')
  @Auth()
  @ListComprasDoc()
  async list(
    @Body() body: ListComprasBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ListComprasResponseDto> {
    return this.comprasService.listCompras(body, user);
  }

  @Post('detail')
  @Auth()
  @GetCompraDoc()
  async detail(
    @Body() body: GetCompraBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetCompraResponseDto> {
    return this.comprasService.getCompra(body, user);
  }

  @Post('update-field')
  @Auth()
  @UpdateCompraFieldDoc()
  async updateField(
    @Body() body: UpdateCompraFieldBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<UpdateCompraResponseDto> {
    return this.comprasService.updateField(body, user);
  }

  @Post('add-item')
  @Auth()
  @AddItemCompraDoc()
  async addItem(
    @Body() body: AddItemCompraBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AddItemCompraResponseDto> {
    return this.comprasService.addItem(body, user);
  }

  @Post('remove-item')
  @Auth()
  @RemoveItemCompraDoc()
  async removeItem(
    @Body() body: RemoveItemCompraBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<RemoveItemCompraResponseDto> {
    return this.comprasService.removeItem(body, user);
  }
}