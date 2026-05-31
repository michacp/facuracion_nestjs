// src/google-drive/google-drive.service.ts
// Equivalente a: src/utils/checkToken.js
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, Auth } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as streamifier from 'streamifier';
@Injectable()
export class GoogleDriveService {
    private readonly logger = new Logger(GoogleDriveService.name);

    // Paths configurables vía .env o con defaults
    private readonly credentialsPath: string;
    private readonly tokenPath: string;
    private readonly rootFolder: string;

    constructor(private configService: ConfigService) {
        this.credentialsPath = this.configService.get<string>(
            'GOOGLE_CREDENTIALS_PATH',
            path.join(process.cwd(), 'src/google-drive/credentials.json'),
        );
        this.tokenPath = this.configService.get<string>(
            'GOOGLE_TOKEN_PATH',
            path.join(process.cwd(), 'src/google-drive/token.json'),
        );
        this.rootFolder = this.configService.get<string>(
            'GOOGLE_DRIVE_ROOT_FOLDER',
            'facturacion_dev',
        );
    }

    // ─────────────────────────────────────────
    // Carga credenciales desde archivo JSON
    // ─────────────────────────────────────────
    private loadCredentials(): Auth.OAuth2ClientOptions & { installed: any } {
        return JSON.parse(fs.readFileSync(this.credentialsPath, 'utf-8'));
    }

    // ─────────────────────────────────────────
    // Verifica token.json — equivalente a verifyToken()
    // Llamado en main.ts al arrancar
    // ─────────────────────────────────────────
    async verifyToken(): Promise<any> {
        if (!fs.existsSync(this.tokenPath)) {
            throw new Error(
                '❌ No existe token.json. Ejecuta generate-token.ts primero.',
            );
        }

        let token: any;
        try {
            token = JSON.parse(fs.readFileSync(this.tokenPath, 'utf-8'));
        } catch {
            throw new Error(
                '❌ token.json está corrupto. Ejecuta generate-token.ts de nuevo.',
            );
        }

        if (!token.refresh_token) {
            throw new Error(
                '❌ token.json no tiene refresh_token. Ejecuta generate-token.ts de nuevo.',
            );
        }

        // Si expira en menos de 5 minutos, renovar preventivamente
        const FIVE_MINUTES = 5 * 60 * 1000;
        const isExpiringSoon =
            token.expiry_date && token.expiry_date - Date.now() < FIVE_MINUTES;

        if (isExpiringSoon) {
            this.logger.log('🔄 Access token por vencer, renovando...');
            return this.refreshAccessToken(token);
        }

        this.logger.log('✅ Token de Google Drive válido.');
        return token;
    }

    // ─────────────────────────────────────────
    // Renueva el access_token — equivalente a refreshAccessToken()
    // ─────────────────────────────────────────
    async refreshAccessToken(existingToken?: any): Promise<any> {
        const credentials = this.loadCredentials();
        const { client_secret, client_id, redirect_uris } = credentials.installed;

        const oAuth2Client = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris[0],
        );

        const token =
            existingToken ?? JSON.parse(fs.readFileSync(this.tokenPath, 'utf-8'));

        if (!token.refresh_token) {
            throw new Error('❌ No hay refresh_token. Ejecuta generate-token.ts.');
        }

        oAuth2Client.setCredentials(token);

        const { credentials: newTokens } = await oAuth2Client.refreshAccessToken();

        // Google no siempre reenvía el refresh_token — conservamos el original
        const merged = {
            ...newTokens,
            refresh_token: newTokens.refresh_token ?? token.refresh_token,
        };

        fs.writeFileSync(this.tokenPath, JSON.stringify(merged, null, 2));
        this.logger.log('✅ Access token renovado y guardado.');

        return merged;
    }

    // ─────────────────────────────────────────
    // Obtiene cliente OAuth2 autenticado listo para usar
    // (útil para subir archivos, etc.)
    // ─────────────────────────────────────────
    async getAuthClient(): Promise<Auth.OAuth2Client> {
        const credentials = this.loadCredentials();
        const { client_secret, client_id, redirect_uris } = credentials.installed;

        const oAuth2Client = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris[0],
        );

        const token = await this.verifyToken();
        oAuth2Client.setCredentials(token);

        return oAuth2Client;
    }

    // ── Privado: getOrCreateFolder ───────────────────────────────────────
    private async getOrCreateFolder(
        folderName: string,
        parentId: string | null = null,
    ): Promise<string> {
        const auth = await this.getAuthClient();
        const drive = google.drive({ version: 'v3', auth });

        const q = [
            `name='${folderName}'`,
            "mimeType='application/vnd.google-apps.folder'",
            'trashed=false',
            parentId ? `'${parentId}' in parents` : "'root' in parents",
        ].join(' and ');

        const res = await drive.files.list({
            q,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        if (res.data.files && res.data.files.length > 0) {
            return res.data.files[0].id!;
        }

        const folder = await drive.files.create({
            requestBody: {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                ...(parentId && { parents: [parentId] }),
            },
            fields: 'id',
        });

        return folder.data.id!;
    }

    // ── Privado: resolver ruta relativa con rootFolder como raíz ─────────
    // folderPath ej: "1/firmas"  → "facturacion_dev/1/firmas"
    private async resolveFolderPath(folderPath: string): Promise<string> {
        // Anteponer siempre la carpeta raíz del ambiente
        const fullPath = `${this.rootFolder}/${folderPath}`;
        const parts = fullPath.split('/');

        let parentId: string | null = null;
        for (const part of parts) {
            parentId = await this.getOrCreateFolder(part, parentId);
        }

        return parentId!;
    }

    // ── uploadFile ───────────────────────────────────────────────────────
    async uploadFile(
        buffer: Buffer,
        filename: string,
        mimeType: string,
        folderPath: string, // relativo: ej "1/firmas"
    ) {
        const auth = await this.getAuthClient();
        const drive = google.drive({ version: 'v3', auth });
        const parentId = await this.resolveFolderPath(folderPath);

        const response = await drive.files.create({
            requestBody: { name: filename, parents: [parentId] },
            media: { mimeType, body: streamifier.createReadStream(buffer) },
            fields: 'id, webViewLink, webContentLink',
        });

        return response.data;
    }

    // ── updateFile ───────────────────────────────────────────────────────
    async updateFile(fileId: string, buffer: Buffer, mimeType: string) {
        const auth = await this.getAuthClient();
        const drive = google.drive({ version: 'v3', auth });

        const response = await drive.files.update({
            fileId,
            media: { mimeType, body: streamifier.createReadStream(buffer) },
            fields: 'id, name, mimeType, webViewLink',
        });

        return response.data;
    }

    // ── getFile ──────────────────────────────────────────────────────────
    async getFile(fileId: string) {
        const auth = await this.getAuthClient();
        const drive = google.drive({ version: 'v3', auth });

        const response = await drive.files.get({
            fileId,
            fields: 'id, name, mimeType, webViewLink, createdTime',
        });

        return response.data;
    }

    // ── getFileBinary ────────────────────────────────────────────────────
    async getFileBinary(fileId: string): Promise<Buffer> {
        const auth = await this.getAuthClient();
        const drive = google.drive({ version: 'v3', auth });

        const response = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'arraybuffer' },
        );

        return Buffer.from(response.data as ArrayBuffer);
    }

    // ── deleteFile ───────────────────────────────────────────────────────
    async deleteFile(fileId: string) {
        const auth = await this.getAuthClient();
        const drive = google.drive({ version: 'v3', auth });

        await drive.files.delete({ fileId });
        return { success: true };
    }
}