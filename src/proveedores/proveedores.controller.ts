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
}