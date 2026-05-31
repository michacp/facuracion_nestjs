import { parseStringPromise } from 'xml2js';

export interface FacturaXmlData {
    // Empresa
    razonSocial: string;
    nombreComercial: string;
    ruc: string;
    dirMatriz: string;
    dirEstablecimiento: string;

    // Comprobante
    claveAcceso: string;
    codDoc: string;
    estab: string;
    ptoEmi: string;
    secuencial: string;
    numeroVenta: string; // estab-ptoEmi-secuencial formateado
    fechaEmision: string;
    ambiente: number;

    // Cliente
    tipoIdentificacionComprador: string;
    razonSocialComprador: string;
    identificacionComprador: string;
    direccionComprador: string;
    telefonoComprador: string;
    emailComprador: string;

    // Financiero
    totalSinImpuestos: number;
    totalDescuento: number;
    iva: number;
    propina: number;
    importeTotal: number;
    formaPago: string;
    plazo: string;

    // Detalles
    detalles: {
        codigoPrincipal: string;
        descripcion: string;
        cantidad: number;
        precioUnitario: number;
        descuento: number;
        total: number;
    }[];

    // Campos adicionales (infoAdicional)
    camposAdicionales: { clave: string; valor: string }[];

    // Estado SRI (viene de BD, no del XML base — el XML autorizado lo tiene)
    estadoSri: string;
    fechaAutorizacion: string | null;
    numeroAutorizacion: string;
}

export async function parsearXmlAutorizado(xmlContent: string): Promise<FacturaXmlData> {
    const parsed = await parseStringPromise(xmlContent, {
        explicitArray: false,
        trim: true,
    });

    // El XML autorizado tiene estructura <autorizacion><comprobante>...</comprobante></autorizacion>
    // El comprobante viene como CDATA — hay que parsearlo de nuevo
    const autorizacion = parsed?.autorizacion;
    const estado = autorizacion?.estado ?? '—';
    const fechaAutorizacion = autorizacion?.fechaAutorizacion ?? null;
    const numeroAutorizacion = autorizacion?.numeroAutorizacion ?? '';

    // Decodificar y parsear el comprobante interno
    const comprobanteRaw = autorizacion?.comprobante ?? '';
    const facturaParsed = await parseStringPromise(comprobanteRaw, {
        explicitArray: false,
        trim: true,
    });

    const factura = facturaParsed?.factura;
    const infoTrib = factura?.infoTributaria;
    const infoFac = factura?.infoFactura;
    const detallesRaw = factura?.detalles?.detalle;
    const infoAdicional = factura?.infoAdicional?.campoAdicional;

    // ── Detalles — puede ser array o un solo objeto ──────────────────────
    const detallesArr = detallesRaw
        ? (Array.isArray(detallesRaw) ? detallesRaw : [detallesRaw])
        : [];

    const detalles = detallesArr.map((d: any) => ({
        codigoPrincipal: d.codigoPrincipal ?? '—',
        descripcion: d.descripcion ?? '—',
        cantidad: Number(d.cantidad ?? 0),
        precioUnitario: Number(d.precioUnitario ?? 0),
        descuento: Number(d.descuento ?? 0),
        total: Number(d.precioTotalSinImpuesto ?? 0),
    }));

    // ── Campos adicionales ───────────────────────────────────────────────
    const camposArr = infoAdicional
        ? (Array.isArray(infoAdicional) ? infoAdicional : [infoAdicional])
        : [];

    const camposAdicionales = camposArr.map((c: any) => ({
        clave: c?.$?.nombre ?? c?.nombre ?? '',
        valor: c?._ ?? c ?? '',
    })).filter((c: any) => c.clave && c.valor);

    // ── Extraer email/teléfono/dirección de camposAdicionales ────────────
    const getCampo = (nombre: string) =>
        camposAdicionales.find(
            (c) => c.clave.toLowerCase() === nombre.toLowerCase(),
        )?.valor ?? '—';

    // ── Forma de pago ────────────────────────────────────────────────────
    const pago = infoFac?.pagos?.pago;

    // ── Número formateado ────────────────────────────────────────────────
    const estab = infoTrib?.estab ?? '';
    const ptoEmi = infoTrib?.ptoEmi ?? '';
    const secuencial = infoTrib?.secuencial ?? '';
    const numeroVenta = `${estab}-${ptoEmi}-${secuencial}`;

    return {
        // Empresa
        razonSocial: infoTrib?.razonSocial ?? '—',
        nombreComercial: infoTrib?.nombreComercial ?? '—',
        ruc: infoTrib?.ruc ?? '—',
        dirMatriz: infoTrib?.dirMatriz ?? '—',
        dirEstablecimiento: infoFac?.dirEstablecimiento ?? '—',

        // Comprobante
        claveAcceso: infoTrib?.claveAcceso ?? '—',
        codDoc: infoTrib?.codDoc ?? '01',
        estab,
        ptoEmi,
        secuencial,
        numeroVenta,
        fechaEmision: infoFac?.fechaEmision ?? '—',
        ambiente: Number(infoTrib?.ambiente ?? 2),

        // Cliente
        tipoIdentificacionComprador: infoFac?.tipoIdentificacionComprador ?? '—',
        razonSocialComprador: infoFac?.razonSocialComprador ?? '—',
        identificacionComprador: infoFac?.identificacionComprador ?? '—',
        direccionComprador: getCampo('Dirección'),
        telefonoComprador: getCampo('Teléfono'),
        emailComprador: getCampo('Email'),

        // Financiero
        totalSinImpuestos: Number(infoFac?.totalSinImpuestos ?? 0),
        totalDescuento: Number(infoFac?.totalDescuento ?? 0),
        iva: Number(infoFac?.totalConImpuestos?.totalImpuesto?.valor ?? 0),
        propina: Number(infoFac?.propina ?? 0),
        importeTotal: Number(infoFac?.importeTotal ?? 0),
        formaPago: pago?.formaPago ?? '—',
        plazo: pago?.plazo ?? '',

        // Detalles
        detalles,

        // Campos adicionales filtrados (sin email/tel/dir que ya están arriba)
        camposAdicionales: camposAdicionales.filter(
            (c) => !['email', 'teléfono', 'dirección', 'observaciones'].includes(
                c.clave.toLowerCase(),
            ),
        ),

        // Estado SRI
        estadoSri: estado,
        fechaAutorizacion: fechaAutorizacion || null,
        numeroAutorizacion,
    };
}