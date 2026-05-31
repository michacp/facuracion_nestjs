import { FileInterceptor } from '@nestjs/platform-express';
import { BadRequestException } from '@nestjs/common';
import * as multer from 'multer';

export const P12FileInterceptor = () =>
    FileInterceptor('file', {
        storage: multer.memoryStorage(),
        limits: {
            fileSize: 5 * 1024 * 1024, // 5 MB máximo
        },
        fileFilter: (_req, file, cb) => {
            // Aceptar .p12 y .pfx
            const allowed = [
                'application/x-pkcs12',
                'application/octet-stream',
            ];
            const ext = file.originalname.toLowerCase();

            if (!ext.endsWith('.p12') && !ext.endsWith('.pfx')) {
                return cb(
                    new BadRequestException('Solo se permiten archivos .p12 o .pfx'),
                    false,
                );
            }
            cb(null, true);
        },
    });