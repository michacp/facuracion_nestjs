import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleDriveService } from '../google-drive/google-drive.service';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { SaveFirmaResponseDto } from './dto/response/save-firma-response.dto';
import * as forge from 'node-forge';
import Cryptr from 'cryptr';
import { FirmaStatusResponseDto } from './dto/response/firma-status-response.dto';
@Injectable()
export class FirmasService {
    private readonly cryptr: Cryptr;

    constructor(
        private readonly prisma: PrismaService,
        private readonly driveService: GoogleDriveService,
        private readonly config: ConfigService,
    ) {
        const secret = this.config.get<string>('CRYPTR_SECRET', 'default_secret');
        this.cryptr = new Cryptr(secret);
    }

    async save(
        file: Express.Multer.File,
        password: string,
        user: JwtPayload,
    ): Promise<SaveFirmaResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException('Sin empresa asignada en el token');

        if (!file) throw new BadRequestException('No se subió ningún archivo');

        // ── 1. Parsear .p12 y extraer fechas ────────────────────────────────
        let fechaEmision: Date;
        let fechaExpiracion: Date;

        try {
            const p12Der = forge.util.createBuffer(file.buffer.toString('binary'));
            const p12Asn1 = forge.asn1.fromDer(p12Der);
            const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

            let certificate: forge.pki.Certificate | undefined;

            for (const safeContent of p12.safeContents) {
                for (const safeBag of safeContent.safeBags) {
                    if (safeBag.cert) certificate = safeBag.cert;
                }
            }

            if (!certificate) {
                throw new BadRequestException('No se encontró certificado en el archivo .p12');
            }

            fechaEmision = certificate.validity.notBefore;
            fechaExpiracion = certificate.validity.notAfter;

        } catch (err: any) {
            // Contraseña incorrecta o archivo corrupto
            throw new BadRequestException(
                err?.message ?? 'Error al procesar el archivo .p12. Verifica la contraseña.',
            );
        }

        const alias = file.originalname;
        const encryptedPassword = this.cryptr.encrypt(password);

        // ── 2. Verificar si ya existe firma para la empresa ──────────────────
        const existing = await this.prisma.firma.findFirst({
            where: { firmas_empresaId: empresaId },
            select: { firmas_id: true, firmas_rutaArchivo: true },
        });

        let firmasId: number;
        let driveFileId: string;

        if (existing) {
            // ── 3a. Ya existe → actualizar archivo en Drive + registro en DB ──
            driveFileId = existing.firmas_rutaArchivo;

            await this.driveService.updateFile(driveFileId, file.buffer, file.mimetype);

            await this.prisma.firma.update({
                where: { firmas_id: existing.firmas_id },
                data: {
                    firmas_alias: alias,
                    firmas_password: encryptedPassword,
                    firmas_fechaEmision: fechaEmision,
                    firmas_fechaExpiracion: fechaExpiracion,
                    firmas_activa: true,
                },
            });

            firmasId = existing.firmas_id;

        } else {
            // ── 3b. No existe → subir a Drive + crear registro en DB ──────────
            const uploaded = await this.driveService.uploadFile(
                file.buffer,
                alias,
                file.mimetype,
                `${empresaId}/firmas`,   // relativo — rootFolder lo antepone el service
            );

            driveFileId = uploaded.id!;

            const firma = await this.prisma.firma.create({
                data: {
                    firmas_empresaId: empresaId,
                    firmas_alias: alias,
                    firmas_rutaArchivo: driveFileId,
                    firmas_password: encryptedPassword,
                    firmas_fechaEmision: fechaEmision,
                    firmas_fechaExpiracion: fechaExpiracion,
                    firmas_activa: true,
                },
                select: { firmas_id: true },
            });

            firmasId = firma.firmas_id;
        }

        return { firmas_id: firmasId, driveFileId, fechaEmision, fechaExpiracion };
    }

    async getStatus(user: JwtPayload): Promise<FirmaStatusResponseDto | null> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException('Sin empresa asignada en el token');

        const firma = await this.prisma.firma.findFirst({
            where: {
                firmas_empresaId: empresaId,
                firmas_activa: true,
            },
            select: {
                firmas_id: true,
                firmas_empresaId: true,
                firmas_alias: true,
                firmas_fechaEmision: true,
                firmas_fechaExpiracion: true,
            },
        });

        if (!firma) return null;

        return {
            id: firma.firmas_id,
            company_id: firma.firmas_empresaId,
            alias: firma.firmas_alias ?? '',
            issue_date: firma.firmas_fechaEmision!,
            expiration_date: firma.firmas_fechaExpiracion!,
        };
    }
}
