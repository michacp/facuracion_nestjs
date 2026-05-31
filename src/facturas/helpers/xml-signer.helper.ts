import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleDriveService } from '../../google-drive/google-drive.service';
import { ConfigService } from '@nestjs/config';
import { signInvoiceXml } from 'ec-sri-invoice-signer';
import Cryptr from 'cryptr';

@Injectable()
export class XmlSignerHelper {
    private readonly logger = new Logger(XmlSignerHelper.name);
    private readonly cryptr: Cryptr;

    constructor(
        private readonly prisma: PrismaService,
        private readonly driveService: GoogleDriveService,
        private readonly config: ConfigService,
    ) {
        this.cryptr = new Cryptr(this.config.getOrThrow<string>('CRYPTR_SECRET'));
    }

    async firmarXML(empresaId: number, xmlString: string): Promise<string> {
        const firma = await this.prisma.firma.findFirst({
            where: { firmas_empresaId: empresaId, firmas_activa: true },
            select: { firmas_rutaArchivo: true, firmas_password: true },
        });

        if (!firma) {
            throw new Error(`No se encontró firma activa para empresa ${empresaId}`);
        }

        const p12Buffer = await this.driveService.getFileBinary(firma.firmas_rutaArchivo);
        const password = this.cryptr.decrypt(firma.firmas_password);

        const signedXml = signInvoiceXml(xmlString, p12Buffer, {
            pkcs12Password: password ?? '',
        });

        return signedXml;
    }
}