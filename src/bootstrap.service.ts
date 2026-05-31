import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GoogleDriveService } from './google-drive/google-drive.service';

@Injectable()
export class BootstrapService implements OnModuleInit {
    private readonly logger = new Logger(BootstrapService.name);

    constructor(private readonly googleDriveService: GoogleDriveService) { }

    async onModuleInit() {
        try {
            this.logger.log('Verificando token de Google Drive al inicio...');
            await this.googleDriveService.verifyToken();
            this.logger.log('Google Drive → token válido y listo');
        } catch (err: any) {
            this.logger.warn('⚠️ Problema con Google Drive al arrancar');
            this.logger.warn(err.message);
            this.logger.warn('Ejecuta: npx ts-node src/google-drive/generate-token.ts');
            // Aquí decides:
            // - Si es crítico → throw err; (detiene la app)
            // - Si es opcional → solo warn y sigues
        }
    }
}