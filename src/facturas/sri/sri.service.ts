import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleDriveService } from '../../google-drive/google-drive.service';

import { parseStringPromise } from 'xml2js';
const soapRequest = require('easy-soap-request');


const REINTENTOS = 6;
const DELAY_BASE_MS = 6000; // 2s → 4s → 6s...

@Injectable()
export class SriService {
    private readonly logger = new Logger(SriService.name);

    constructor(
        private readonly config: ConfigService,
        private readonly driveService: GoogleDriveService,
    ) { }

    private getUrls(ambiente: string) {
        const esPruebas = ambiente === '1';
        return {
            recepcion: esPruebas
                ? 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl'
                : 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline',
            autorizacion: esPruebas
                ? 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline'
                : 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline',
        };
    }

    private esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // ── enviarComprobante ────────────────────────────────────────────────
    async enviarComprobante(xmlFirmado: string): Promise<string> {
        const parsed = await parseStringPromise(xmlFirmado, { explicitArray: false });
        const ambiente = parsed.factura.infoTributaria.ambiente;
        const { recepcion } = this.getUrls(ambiente);

        const base64 = Buffer.from(xmlFirmado, 'utf8').toString('base64');

        // ← sin "as any", soapRequest ya es la función directamente
        const { response } = await soapRequest({
            url: recepcion,
            headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
            xml: this.buildSoapRecepcion(base64),
        });

        return response.body.toString();
    }

    // ── consultarEstado ──────────────────────────────────────────────────
    async consultarEstado(claveAcceso: string): Promise<string> {
        const ambiente = claveAcceso[23];
        const { autorizacion } = this.getUrls(ambiente);

        for (let i = 1; i <= REINTENTOS; i++) {
            try {
                this.logger.log(`🔍 Consulta SRI intento ${i}/${REINTENTOS}`);

                // ← sin "as any"
                const { response } = await soapRequest({
                    url: autorizacion,
                    headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
                    xml: this.buildSoapAutorizacion(claveAcceso),
                });

                const body = response.body.toString();
                const parsed = await parseStringPromise(body, { explicitArray: false });

                const autorizacionNode =
                    parsed?.['soap:Envelope']?.['soap:Body']?.[
                        'ns2:autorizacionComprobanteResponse'
                    ]?.RespuestaAutorizacionComprobante?.autorizaciones?.autorizacion;

                if (autorizacionNode) {
                    this.logger.log(`✅ SRI respondió en intento ${i}`);
                    return body;
                }

                this.logger.warn(`⏳ Sin respuesta en intento ${i}, esperando ${DELAY_BASE_MS * i}ms...`);
                await this.esperar(DELAY_BASE_MS * i);

            } catch (err) {
                this.logger.error(`❌ Error en intento ${i}: ${err}`);
                if (i === REINTENTOS) throw err;
                await this.esperar(DELAY_BASE_MS * i);
            }
        }

        this.logger.error('⚠️ SRI no respondió tras todos los reintentos');
        return '';
    }

    // ── 3. Procesar respuesta RECIBIDA / AUTORIZADA ──────────────────────
    async procesarRespuestaAutorizacion(
        consultaXml: string,
        empresaId: number,
        claveAcceso: string,
    ): Promise<{
        estado: string;
        mensajeCompleto: string;
        fechaAutorizacion: string | null;
        driveFileId: string | null;
    }> {
        // Sin respuesta del SRI → estado PENDIENTE, XML guardado igualmente
        if (!consultaXml) {
            return {
                estado: 'PENDIENTE',
                mensajeCompleto: 'SRI no respondió en tiempo. Reintento pendiente.',
                fechaAutorizacion: null,
                driveFileId: null,
            };
        }

        const parser = new (require('xml2js').Parser)({ explicitArray: false });
        const parsed = await parser.parseStringPromise(consultaXml);

        const autorizacion =
            parsed?.['soap:Envelope']?.['soap:Body']?.[
                'ns2:autorizacionComprobanteResponse'
            ]?.RespuestaAutorizacionComprobante?.autorizaciones?.autorizacion;

        if (!autorizacion) {
            return {
                estado: 'PENDIENTE',
                mensajeCompleto: 'SRI no devolvió autorización.',
                fechaAutorizacion: null,
                driveFileId: null,
            };
        }

        const estado = autorizacion.estado as string;
        const fechaAutorizacion = autorizacion.fechaAutorizacion ?? null;
        const comprobanteCodif = autorizacion.comprobante ?? '';
        const comprobanteXML = this.decodeXML(comprobanteCodif);

        let mensajeCompleto = '';
        if (autorizacion.mensajes?.mensaje) {
            const msj = autorizacion.mensajes.mensaje;
            const arr = Array.isArray(msj) ? msj : [msj];
            mensajeCompleto = arr
                .map((m: any) => `${m.mensaje ?? ''}${m.informacionAdicional ? ' - ' + m.informacionAdicional : ''}`)
                .join(' | ');
        }

        // ── Construir XML final con autorización ─────────────────────────
        const xmlFinal = `<?xml version="1.0" encoding="UTF-8"?>
<autorizacion>
  <estado>${estado}</estado>
  <numeroAutorizacion>${autorizacion.numeroAutorizacion ?? ''}</numeroAutorizacion>
  <fechaAutorizacion>${fechaAutorizacion ?? ''}</fechaAutorizacion>
  <ambiente>${autorizacion.ambiente ?? ''}</ambiente>
  ${mensajeCompleto ? `<mensajes><mensaje><![CDATA[${mensajeCompleto}]]></mensaje></mensajes>` : ''}
  <comprobante><![CDATA[${comprobanteXML}]]></comprobante>
</autorizacion>`;

        // ── Subir a Drive siempre (incluso NO AUTORIZADO) ─────────────────
        const carpeta = this.carpetaPorEstado(estado, empresaId);
        const driveFileId = await this.subirXmlDrive(xmlFinal, claveAcceso, carpeta);

        return { estado, mensajeCompleto, fechaAutorizacion, driveFileId };
    }

    // ── 4. Procesar respuesta DEVUELTA ───────────────────────────────────
    async procesarRespuestaDevuelta(
        envioSRI: string,
        xmlFirmado: string,
        empresaId: number,
        claveAcceso: string,
    ): Promise<{
        estado: string;
        mensajeCompleto: string;
        driveFileId: string | null;
    }> {
        const result = await parseStringPromise(envioSRI, { explicitArray: false });

        const respuesta =
            result['soap:Envelope']['soap:Body']['ns2:validarComprobanteResponse']
                .RespuestaRecepcionComprobante;

        const estado = respuesta.estado as string;
        const comprobante = respuesta?.comprobantes?.comprobante;
        const mensajes = comprobante?.mensajes?.mensaje;
        const arr = mensajes ? (Array.isArray(mensajes) ? mensajes : [mensajes]) : [];

        const mensajeCompleto = arr
            .map((m: any) => `${m.mensaje ?? ''}${m.informacionAdicional ? ' - ' + m.informacionAdicional : ''}`)
            .join(' | ');

        const mensajesXML = arr
            .map(
                (m: any) => `
      <mensaje>
        <identificador>${m.identificador ?? ''}</identificador>
        <mensaje>${m.mensaje ?? ''}</mensaje>
        ${m.informacionAdicional ? `<informacionAdicional>${m.informacionAdicional}</informacionAdicional>` : ''}
        <tipo>${m.tipo ?? ''}</tipo>
      </mensaje>`,
            )
            .join('');

        const xmlFinal = `<?xml version="1.0" encoding="UTF-8"?>
<autorizacion>
  <estado>${estado}</estado>
  <comprobante><![CDATA[${xmlFirmado}]]></comprobante>
  <mensajes>${mensajesXML}</mensajes>
</autorizacion>`;

        const carpeta = this.carpetaPorEstado(estado, empresaId);
        const driveFileId = await this.subirXmlDrive(xmlFinal, claveAcceso, carpeta);

        return { estado, mensajeCompleto, driveFileId };
    }

    // ── Helpers privados ─────────────────────────────────────────────────
    private carpetaPorEstado(estado: string, empresaId: number): string {
        const subcarpeta: Record<string, string> = {
            AUTORIZADO: 'autorizado',
            'NO AUTORIZADO': 'no_autorizado',
            DEVUELTA: 'devuelta',
            PENDIENTE: 'pendiente',
        };
        const sub = subcarpeta[estado] ?? 'otros';
        return `${empresaId}/facturas/${sub}`;
    }

    private async subirXmlDrive(
        xmlContent: string,
        claveAcceso: string,
        carpeta: string,
    ): Promise<string | null> {
        try {
            const buffer = Buffer.from(xmlContent, 'utf-8');
            const uploaded = await this.driveService.uploadFile(
                buffer,
                `${claveAcceso}.xml`,
                'text/xml',
                carpeta,
            );
            return uploaded.id ?? null;
        } catch (err) {
            this.logger.error(`Error subiendo XML a Drive: ${err}`);
            return null; // No interrumpe el flujo principal
        }
    }

    private decodeXML(encoded: string): string {
        return encoded
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
    }

    private buildSoapRecepcion(base64: string): string {
        return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:validarComprobante>
      <xml>${base64}</xml>
    </ec:validarComprobante>
  </soapenv:Body>
</soapenv:Envelope>`;
    }

    private buildSoapAutorizacion(claveAcceso: string): string {
        return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:autorizacionComprobante>
      <claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>
    </ec:autorizacionComprobante>
  </soapenv:Body>
</soapenv:Envelope>`;
    }
}