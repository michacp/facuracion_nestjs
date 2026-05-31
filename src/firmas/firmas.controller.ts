import { Body, Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FirmasService } from './firmas.service';
import { Auth, CurrentUser } from '../auth/decorators';
import { SaveFirmaDoc } from './docs/save-firma.doc';
import { P12FileInterceptor } from '../multer/multer/interceptors/p12-file.interceptor';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { SaveFirmaResponseDto } from './dto/response/save-firma-response.dto';
import { SaveFirmaBodyDto } from './dto/request/save-firma-body.dto';
import { FirmaStatusDoc } from './docs/firma-status.doc';
import { FirmaStatusResponseDto } from './dto/response/firma-status-response.dto';

@Controller('firmas')
export class FirmasController {
  constructor(private readonly firmasService: FirmasService) { }

  // Legacy: POST /signature/save
  @Post('save')
  @Auth()
  @SaveFirmaDoc()
  @UseInterceptors(P12FileInterceptor())
  async save(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: SaveFirmaBodyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SaveFirmaResponseDto> {
    return this.firmasService.save(file, body.password, user);
  }
  @Get('status')
  @Auth()
  @FirmaStatusDoc()
  async status(
    @CurrentUser() user: JwtPayload,
  ): Promise<FirmaStatusResponseDto | null> {
    return this.firmasService.getStatus(user);
  }

}
