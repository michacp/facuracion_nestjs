const XMLWriter = require('xml-writer');
import * as moment from 'moment';

export interface ImpuestoDetalle {
    codigo: string;
    codigoPorcentaje: string;
    baseImponible: number;
    tarifa: number;
    valor: number;
}

export interface DetalleFactura {
    codigoPrincipal: string;
    codigoAuxiliar?: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    precioTotalSinImpuesto: number;
    impuestos: ImpuestoDetalle[];
}

export interface CampoAdicional {
    nombre: string;
    valor: string;
}

export interface FacturaTemplateData {
    ambiente: string;
    tipoEmision: string;
    razonSocial: string;
    nombreComercial: string;
    ruc: string;
    claveAcceso: string;
    codDoc: string;
    estab: string;
    ptoEmi: string;
    secuencial: string;
    dirMatriz: string;
    regimenMicroempresas: string;
    agenteRetencion: boolean;
    fechaEmision: string;
    dirEstablecimiento: string;
    obligadoContabilidad: boolean;
    tipoIdentificacionComprador: string;
    razonSocialComprador: string;
    identificacionComprador: string;
    totalSinImpuestos: number;
    totalDescuento: number;
    propina: number;
    importeTotal: number;
    moneda: string;
    pagoFormaPago: string;
    pagoTotal: number;
    unidadTiempo: string;
    plazo: string;
    detalles: DetalleFactura[];
    // ← camposAdicionales viene de ClienteCampoAdicional + observaciones/email/etc
    camposAdicionales: CampoAdicional[];
}

export function generarXMLFactura(data: FacturaTemplateData): string {
    // ── Calcular totales de impuestos desde detalles ─────────────────────
    let totalCodigo = '';
    let totalCodigoPorcentaje = '';
    let totalBaseImponible = 0;
    let totalTarifa = 0;
    let totalValor = 0;

    for (const d of data.detalles) {
        const imp = d.impuestos[0];
        if (imp) {
            totalCodigo = imp.codigo;
            totalCodigoPorcentaje = imp.codigoPorcentaje;
            totalBaseImponible += imp.baseImponible;
            totalTarifa += imp.tarifa;
            totalValor += imp.valor;
        }
    }

    const xml = new XMLWriter('\t');
    xml
        .startDocument('1.0', 'UTF-8', true)
        .startElement('factura')
        .writeAttribute('id', 'comprobante')
        .writeAttribute('version', '1.1.0');

    // ── infoTributaria ───────────────────────────────────────────────────
    xml
        .startElement('infoTributaria')
        .startElement('ambiente').text(data.ambiente).endElement()
        .startElement('tipoEmision').text(data.tipoEmision).endElement()
        .startElement('razonSocial').text(data.razonSocial).endElement()
        .startElement('nombreComercial').text(data.nombreComercial ?? '').endElement()
        .startElement('ruc').text(data.ruc).endElement()
        .startElement('claveAcceso').text(data.claveAcceso).endElement()
        .startElement('codDoc').text(data.codDoc).endElement()
        .startElement('estab').text(data.estab).endElement()
        .startElement('ptoEmi').text(data.ptoEmi).endElement()
        .startElement('secuencial').text(data.secuencial).endElement()
        .startElement('dirMatriz').text(data.dirMatriz).endElement();

    if (data.regimenMicroempresas && data.regimenMicroempresas !== 'NO') {
        xml.startElement('contribuyenteRimpe').text(data.regimenMicroempresas).endElement();
    }
    if (data.agenteRetencion) {
        xml.startElement('agenteRetencion').text('1').endElement();
    }

    xml.endElement(); // </infoTributaria>

    // ── infoFactura ──────────────────────────────────────────────────────
    xml
        .startElement('infoFactura')
        .startElement('fechaEmision').text(data.fechaEmision).endElement()
        .startElement('dirEstablecimiento').text(data.dirEstablecimiento).endElement()
        .startElement('obligadoContabilidad').text(data.obligadoContabilidad ? 'SI' : 'NO').endElement()
        .startElement('tipoIdentificacionComprador').text(data.tipoIdentificacionComprador).endElement()
        .startElement('razonSocialComprador').text(data.razonSocialComprador).endElement()
        .startElement('identificacionComprador').text(data.identificacionComprador).endElement()
        .startElement('totalSinImpuestos').text(data.totalSinImpuestos.toFixed(2)).endElement()
        .startElement('totalDescuento').text(data.totalDescuento.toFixed(2)).endElement();

    // totalConImpuestos
    xml
        .startElement('totalConImpuestos')
        .startElement('totalImpuesto')
        .startElement('codigo').text(totalCodigo).endElement()
        .startElement('codigoPorcentaje').text(totalCodigoPorcentaje).endElement()
        .startElement('baseImponible').text(totalBaseImponible.toFixed(2)).endElement()
        .startElement('tarifa').text(String(totalTarifa)).endElement()
        .startElement('valor').text(totalValor.toFixed(2)).endElement()
        .endElement()   // </totalImpuesto>
        .endElement();  // </totalConImpuestos>

    xml
        .startElement('propina').text(data.propina.toFixed(2)).endElement()
        .startElement('importeTotal').text(data.importeTotal.toFixed(2)).endElement()
        .startElement('moneda').text(data.moneda).endElement();

    // pagos
    xml
        .startElement('pagos')
        .startElement('pago')
        .startElement('formaPago').text(data.pagoFormaPago).endElement()
        .startElement('total').text(data.pagoTotal.toFixed(2)).endElement();

    if (data.plazo && data.unidadTiempo) {
        xml
            .startElement('plazo').text(data.plazo).endElement()
            .startElement('unidadTiempo').text(data.unidadTiempo).endElement();
    }

    xml
        .endElement()   // </pago>
        .endElement()   // </pagos>
        .endElement();  // </infoFactura>

    // ── detalles ─────────────────────────────────────────────────────────
    xml.startElement('detalles');
    for (const d of data.detalles) {
        xml
            .startElement('detalle')
            .startElement('codigoPrincipal').text(d.codigoPrincipal).endElement();

        if (d.codigoAuxiliar) {
            xml.startElement('codigoAuxiliar').text(d.codigoAuxiliar).endElement();
        }

        xml
            .startElement('descripcion').text(d.descripcion).endElement()
            .startElement('cantidad').text(String(d.cantidad)).endElement()
            .startElement('precioUnitario').text(d.precioUnitario.toFixed(2)).endElement()
            .startElement('descuento').text(d.descuento.toFixed(2)).endElement()
            .startElement('precioTotalSinImpuesto').text(d.precioTotalSinImpuesto.toFixed(2)).endElement();

        if (d.impuestos.length > 0) {
            xml.startElement('impuestos');
            for (const imp of d.impuestos) {
                xml
                    .startElement('impuesto')
                    .startElement('codigo').text(imp.codigo).endElement()
                    .startElement('codigoPorcentaje').text(imp.codigoPorcentaje).endElement()
                    .startElement('tarifa').text(String(imp.tarifa)).endElement()
                    .startElement('baseImponible').text(imp.baseImponible.toFixed(2)).endElement()
                    .startElement('valor').text(imp.valor.toFixed(2)).endElement()
                    .endElement();
            }
            xml.endElement(); // </impuestos>
        }

        xml.endElement(); // </detalle>
    }
    xml.endElement(); // </detalles>

    // ── infoAdicional — campos desde BD (sin hardcodeo) ──────────────────
    const camposFiltrados = data.camposAdicionales.filter(
        (c) => c.valor && c.valor.trim() !== '',
    );

    if (camposFiltrados.length > 0) {
        xml.startElement('infoAdicional');
        for (const campo of camposFiltrados) {
            xml
                .startElement('campoAdicional')
                .writeAttribute('nombre', campo.nombre)
                .text(campo.valor)
                .endElement();
        }
        xml.endElement(); // </infoAdicional>
    }

    xml
        .endElement()   // </factura>
        .endDocument();

    return xml.toString();
}