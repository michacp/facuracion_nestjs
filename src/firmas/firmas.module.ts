import { Module } from '@nestjs/common';
import { FirmasService } from './firmas.service';
import { FirmasController } from './firmas.controller';
import { GoogleDriveModule } from '../google-drive/google-drive.module';
import multer from 'multer';
import { AppMulterModule } from '../multer/multer.module';

@Module({
  imports: [GoogleDriveModule, AppMulterModule],
  controllers: [FirmasController],
  providers: [FirmasService],
})
export class FirmasModule { }
