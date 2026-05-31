import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';

@Module({
    imports: [
        MulterModule.register({
            storage: multer.memoryStorage(), // buffer en memoria, sin tocar disco
        }),
    ],
    exports: [MulterModule], // exportado para que cualquier módulo lo use
})
export class AppMulterModule { }