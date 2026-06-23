import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProveedoresService } from './proveedores.service';
import { Auth, CurrentUser } from '../auth/decorators';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { GetNewDataProveedorDoc } from './docs/get-new-data-proveedor.doc';
import { SaveProveedorDoc } from './docs/save-proveedor.doc';
import { FindProveedorDoc } from './docs/find-proveedor.doc';
import { SaveProveedorBodyDto } from './dto/request/save-proveedor-body.dto';
import { FindProveedorBodyDto } from './dto/request/find-proveedor-body.dto';
import type { GetNewDataProveedorResponseDto } from './dto/response/get-new-data-proveedor-response.dto';
import type { SaveProveedorResponseDto } from './dto/response/save-proveedor-response.dto';
import type { FindProveedorResponseDto } from './dto/response/find-proveedor-response.dto';
import { ListProveedoresDoc } from './docs/list-proveedores.doc';
import { ListProveedoresBodyDto } from './dto/request/list-proveedores-body.dto';
import { ListProveedoresResponseDto } from './dto/response/list-proveedores-response.dto';
import { GetProveedorDoc } from './docs/get-proveedor.doc';
import { GetProveedorBodyDto } from './dto/request/get-proveedor-body.dto';
import { GetProveedorResponseDto } from './dto/response/get-proveedor-response.dto';
import { UpdateProveedorDoc } from './docs/update-proveedor.doc';
import { UpdateProveedorBodyDto } from './dto/request/update-proveedor-body.dto';
import { DeleteProveedorDoc } from './docs/delete-proveedor.doc';
import { DeleteProveedorBodyDto } from './dto/request/delete-proveedor-body.dto';
import { DeleteProveedorResponseDto } from './dto/response/delete-proveedor-response.dto';

@ApiTags('Proveedores')
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) { }

  @Get('getnewdata')
  @Auth()
  @GetNewDataProveedorDoc()
  async getNewData(): Promise<GetNewDataProveedorResponseDto> {
    return this.proveedoresService.getNewData();
  }

  @Post('save')
  @Auth()
  @SaveProveedorDoc()
  async save(
    @Body() body: SaveProveedorBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SaveProveedorResponseDto> {
    return this.proveedoresService.save(body, user);
  }

  @Post('find')
  @Auth()
  @FindProveedorDoc()
  async find(
    @Body() body: FindProveedorBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<FindProveedorResponseDto[]> {
    return this.proveedoresService.find(body, user);
  }

  @Post('list')
  @Auth()
  @ListProveedoresDoc()
  async list(
    @Body() body: ListProveedoresBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ListProveedoresResponseDto> {
    return this.proveedoresService.listProveedores(body, user);
  }

  @Post('get')
  @Auth()
  @GetProveedorDoc()
  async get(
    @Body() body: GetProveedorBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetProveedorResponseDto> {
    return this.proveedoresService.getProveedor(body, user);
  }

  @Post('update')
  @Auth()
  @UpdateProveedorDoc()
  async update(
    @Body() body: UpdateProveedorBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SaveProveedorResponseDto> {
    return this.proveedoresService.updateProveedor(body, user);
  }

  @Post('delete')
  @Auth()
  @DeleteProveedorDoc()
  async delete(
    @Body() body: DeleteProveedorBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<DeleteProveedorResponseDto> {
    return this.proveedoresService.deleteProveedor(body, user);
  }
}