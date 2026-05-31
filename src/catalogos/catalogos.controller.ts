import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CatalogosService } from './catalogos.service';
import { Auth } from '../auth/decorators';
import { FindModelsBodyDto } from './dto/request/find-models-body.dto';
import { ModelItemDto } from './dto/response/find-models-response.dto';
import { FindModelsDoc } from './docs/find-models.doc';
import { FindPercentajesDoc } from './docs/find-percentajes.doc';
import { FindPercentajesBodyDto } from './dto/request/find-percentajes-body.dto';
import { TarifaItemDto } from './dto/response/find-percentajes-response.dto';

@ApiTags('Catálogos')
@Controller('catalogos')
export class CatalogosController {
  constructor(private readonly catalogosService: CatalogosService) { }

  // Legacy: POST /products/findmodels
  @Post('findmodels')
  @Auth()
  @FindModelsDoc()
  async findModels(
    @Body() body: FindModelsBodyDto,
  ): Promise<ModelItemDto[]> {
    return this.catalogosService.findModels(body);
  }

  @Post('findpercentajes')
  @Auth()
  @FindPercentajesDoc()
  async findPercentajes(
    @Body() body: FindPercentajesBodyDto,
  ): Promise<TarifaItemDto[]> {
    return this.catalogosService.findPercentajes(body);
  }
}