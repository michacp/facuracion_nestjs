import { Body, Controller, Get, HttpCode, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { Auth, CurrentUser } from '../auth/decorators';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { GetNewDataDoc } from './docs/get-new-data.doc';
import { GetNewDataResponseDto } from './dto/response/get-new-data-response.dto';
import { SaveItemDoc } from './docs/save-item.doc';
import { SaveItemBodyDto } from './dto/request/save-item-body.dto';
import { SaveItemResponseDto } from './dto/response/save-item-response.dto';
import { Last5SavesDoc } from './docs/last5-saves.doc';
import { Last5SavesItemDto } from './dto/response/last5-saves-response.dto';
import { ListItemsBodyDto } from './dto/request/list-items-body.dto';
import { ListItemsResponseDto } from './dto/response/list-items-response.dto';
import { ListItemsDoc } from './docs/list-items.doc';
import { FindOneItemDoc } from './docs/find-one-item.doc';
import { FindOneItemBodyDto } from './dto/request/find-one-item-body.dto';
import { FindOneItemResponseDto } from './dto/response/find-one-item-response.dto';
import { EditItemDoc } from './docs/edit-item.doc';
import { EditItemBodyDto } from './dto/request/edit-item-body.dto';
import { FindProductsIdNameDoc } from './docs/find-products-idname.doc';
import { FindProductsIdNameBodyDto } from './dto/request/find-products-idname-body.dto';
import { FindProductsIdNameResponseDto } from './dto/response/find-products-idname-response.dto';
import { FindItemsPurchaseDoc } from './docs/find-items-purchase.doc';
import { FindItemsPurchaseBodyDto } from './dto/request/find-items-purchase-body.dto';
import { FindItemsPurchaseResponseDto } from './dto/response/find-items-purchase-response.dto';

@ApiTags('Items (Productos y Servicios)')
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) { }

  @Get('getnewdata')
  @Auth()
  @GetNewDataDoc() // Aplicamos toda la documentación limpia de Swagger
  async getNewData(
    @CurrentUser() user: JwtPayload,
  ): Promise<GetNewDataResponseDto> {
    // console.log(user)
    // Pasamos el payload del usuario al servicio por si requieres filtrar por empresa en el futuro
    return await this.itemsService.getNewProductData(user);
  }
  @Post('save')
  @Auth()
  @SaveItemDoc()
  async save(
    @Body() body: SaveItemBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SaveItemResponseDto> {
    return this.itemsService.saveItem(body, user);
  }


  @Get('last5saves')
  @Auth()
  @Last5SavesDoc()
  async last5Saves(
    @CurrentUser() user: JwtPayload,
  ): Promise<Last5SavesItemDto[]> {
    return this.itemsService.last5Saves(user);
  }

  @Post('list')
  @Auth()
  @ListItemsDoc()
  async list(
    @Body() body: ListItemsBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ListItemsResponseDto> {
    return this.itemsService.listItems(body, user);
  }
  @Post('findoneproduct')
  @Auth()
  @FindOneItemDoc()
  async findOneProduct(
    @Body() body: FindOneItemBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<FindOneItemResponseDto> {
    return this.itemsService.findOneItem(body, user);
  }

  @Put('editproduct')
  @Auth()
  @EditItemDoc()
  @HttpCode(200)
  async editProduct(
    @Body() body: EditItemBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.itemsService.editItem(body, user);
  }

  @Post('findproductsidname')
  @Auth()
  @FindProductsIdNameDoc()
  async findProductsIdName(
    @Body() body: FindProductsIdNameBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<FindProductsIdNameResponseDto[]> {
    return this.itemsService.findProductsIdName(body, user);
  }
  @Post('find-for-purchase')
  @Auth()
  @FindItemsPurchaseDoc()
  async findForPurchase(
    @Body() body: FindItemsPurchaseBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<FindItemsPurchaseResponseDto[]> {
    return this.itemsService.findItemsForPurchase(body, user);
  }
}