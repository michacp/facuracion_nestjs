import { Controller, Get, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { Auth, CurrentUser } from '../auth/decorators';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { GetNewDataClientDoc } from './docs/get-new-data-client.doc';
import { SaveClientDoc } from './docs/save-client.doc';
import { FindClientDoc } from './docs/find-client.doc';
import { SaveClientBodyDto } from './dto/request/save-client-body.dto';
import { FindClientBodyDto } from './dto/request/find-client-body.dto';
import type { TipoIdentificacionDto } from './dto/response/get-new-data-client-response.dto';
import type { SaveClientResponseDto } from './dto/response/save-client-response.dto';
import type { FindClientResponseDto } from './dto/response/find-client-response.dto';
import { DeleteClientBodyDto } from './dto/request/delete-client-body.dto';
import { DeleteClientDoc } from './docs/delete-client.doc';
import { EditClientBodyDto } from './dto/request/edit-client-body.dto';
import { EditClientDoc } from './docs/edit-client.doc';

@ApiTags('Clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientsService: ClientesService) { }

  @Get('getnewdata')
  @Auth()
  @GetNewDataClientDoc()
  async getNewData(): Promise<TipoIdentificacionDto[]> {
    return this.clientsService.getNewData();
  }

  @Post('save')
  @Auth()
  @SaveClientDoc()
  async save(
    @Body() body: SaveClientBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SaveClientResponseDto> {
    return this.clientsService.save(body, user);
  }

  @Post('edit')
  @Auth()
  @EditClientDoc()
  @HttpCode(200)
  async edit(
    @Body() body: EditClientBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.clientsService.edit(body, user);
  }

  @Post('delete')
  @Auth()
  @DeleteClientDoc()
  @HttpCode(200)
  async remove(
    @Body() body: DeleteClientBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.clientsService.remove(body, user);
  }

  @Post('find')
  @Auth()
  @FindClientDoc()
  async find(
    @Body() body: FindClientBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<FindClientResponseDto[]> {
    return this.clientsService.find(body, user);
  }
}