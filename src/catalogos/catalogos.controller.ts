import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CatalogosService } from './catalogos.service';
import { Auth, CurrentUser } from '../auth/decorators';
import { FindModelsBodyDto } from './dto/request/find-models-body.dto';
import { ModelItemDto } from './dto/response/find-models-response.dto';
import { FindModelsDoc } from './docs/find-models.doc';
import { FindPercentajesDoc } from './docs/find-percentajes.doc';
import { FindPercentajesBodyDto } from './dto/request/find-percentajes-body.dto';
import { TarifaItemDto } from './dto/response/find-percentajes-response.dto';
import { GetRolesDoc } from './docs/get-roles.doc';
import { SelectOptionDto } from './dto/response/select-option.dto';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
@Auth()
@ApiTags('Catálogos')
@Controller('catalogos')
export class CatalogosController {
  constructor(private readonly catalogosService: CatalogosService) { }

  // Legacy: POST /products/findmodels
  @Post('findmodels')
  @FindModelsDoc()
  async findModels(
    @Body() body: FindModelsBodyDto,
  ): Promise<ModelItemDto[]> {
    return this.catalogosService.findModels(body);
  }

  @Post('findpercentajes')
  @FindPercentajesDoc()
  async findPercentajes(
    @Body() body: FindPercentajesBodyDto,
  ): Promise<TarifaItemDto[]> {
    return this.catalogosService.findPercentajes(body);
  }

  @Get('roles')
  @Auth()
  @GetRolesDoc()
  async getRoles(@CurrentUser() user: JwtPayload): Promise<SelectOptionDto[]> {
    const isSuperAdmin = user.rol === 'SUPERADMIN';
    return this.catalogosService.getRoles(isSuperAdmin);
  }
}