// shared/ticket-height.helper.ts

export interface TicketHeightOptions {
    /** Altura fija del bloque "tipo comprobante + número + fecha + extras" */
    comprobanteHeaderHeight: number;

    /** Incluir campos adicionales del cliente (siempre) */
    clienteCamposAdicionales: number;

    /** Campos condicionales del cliente (dirección, teléfono, email) */
    clienteExtras?: {
        direccion?: string | null;
        telefono?: string | null;
        email?: string | null;
    };

    /** Si los totales de descuento e IVA son siempre visibles (factura)
     *  o condicionales (comprobante) */
    totalesCondicionales?: {
        descuento_total: number;
        iva: number;
    };

    /** Si siempre se muestran descuento e IVA sin condición */
    totalesFijos?: boolean;

    propina?: number;

    /** Texto de observaciones (solo comprobante) */
    observaciones?: string | null;

    /** Bloque SRI al final */
    factura?: {
        clave_acceso?: string;
        fecha_autorizacion?: string | null;
        barcodeBuffer?: Buffer | null;
    } | null;

    /** Colchón de seguridad final (default: 8) */
    safetyPad?: number;
}

export function calculateTicketHeight(
    detalles: any[],
    opts: TicketHeightOptions,
): number {
    let h = 20; // márgenes top + bottom

    // ── Bloques siempre presentes ───────────────────────────────────────
    h += 44;                            // Logo
    h += 34 + 6;                        // Empresa + separadorDash
    h += opts.comprobanteHeaderHeight;  // Tipo doc + N° + Fecha + extras
    h += 6;                             // separadorDash

    // ── Cliente ─────────────────────────────────────────────────────────
    h += 24;                            // Título + Razón Social + Identificación
    const extras = opts.clienteExtras ?? {};
    if (extras.direccion) h += 9;
    if (extras.telefono) h += 9;
    if (extras.email) h += 9;
    h += opts.clienteCamposAdicionales * 9;
    h += 6;                             // separadorDash

    // ── Detalle ──────────────────────────────────────────────────────────
    h += 16;                            // Header de columnas
    for (const d of detalles) {
        const nombre = (d.lote?.item?.item_nombre ?? d.item?.item_nombre ?? '').trim();
        const lineas = Math.ceil(nombre.length / 28) || 1;
        h += lineas * 9 + 2;
    }
    h += 6;                             // separadorDash

    // ── Totales ──────────────────────────────────────────────────────────
    h += 10;                            // Subtotal (siempre)

    if (opts.totalesFijos) {
        // Factura: descuento e IVA siempre visibles
        h += 10 + 10;
    } else if (opts.totalesCondicionales) {
        if (Number(opts.totalesCondicionales.descuento_total) > 0) h += 10;
        if (Number(opts.totalesCondicionales.iva) > 0) h += 10;
    }

    if (Number(opts.propina ?? 0) > 0) h += 10;
    h += 12;                            // TOTAL (font 9pt)

    // ── Observaciones (solo comprobante) ─────────────────────────────────
    if (opts.observaciones) {
        h += 6;
        h += (Math.ceil(opts.observaciones.length / 35) || 1) * 9;
    }

    // ── Bloque SRI ───────────────────────────────────────────────────────
    if (opts.factura) {
        const f = opts.factura;
        h += 6;                         // separadorDash
        h += 24;                        // Título + Ambiente + Estado

        if (f.fecha_autorizacion) h += 8;

        if (f.barcodeBuffer !== undefined) {
            // Factura: altura dinámica según si el buffer existe
            if (f.barcodeBuffer) h += 24;
        } else {
            // Comprobante: bloque SRI fijo (incluye barcode interno)
            h += 48;
        }

        h += 8;                         // Clave de acceso final
    }

    // ── Pie ───────────────────────────────────────────────────────────────
    h += 6 + 12;

    return Math.ceil(h + (opts.safetyPad ?? 8));
}