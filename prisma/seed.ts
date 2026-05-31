// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('❌ DATABASE_URL no está definida en .env');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Iniciando seed de catálogos globales...\n');

    // ─────────────────────────────────────────────────────────────────────────
    // 1. ROLES
    // Datos del legacy + SUPERADMIN (nuevo para multi-tenant)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('👤 Roles...');
    const roles = [
        {
            rol_nombre: 'SUPERADMIN',
            rol_descripcion: 'Acceso global al sistema: gestiona empresas, planes y suscripciones',
        },
        {
            rol_nombre: 'ADMINISTRADOR',
            rol_descripcion: 'Usuario con permisos completos sobre la empresa',
        },
        {
            rol_nombre: 'FACTURADOR',
            rol_descripcion: 'Usuario con permisos para facturar',
        },
    ];

    for (const rol of roles) {
        await prisma.role.upsert({
            where: { rol_nombre: rol.rol_nombre },
            update: { rol_descripcion: rol.rol_descripcion },
            create: rol,
        });
    }
    console.log(`   ✅ ${roles.length} roles`);

    // ─────────────────────────────────────────────────────────────────────────
    // 2. REGÍMENES TRIBUTARIOS
    // Datos exactos del legacy
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🏛️  Regímenes...');
    const regimenes = [
        { regimenes_nombre: 'NO' },
        { regimenes_nombre: 'CONTRIBUYENTE RÉGIMEN RIMPE' },
        { regimenes_nombre: 'CONTRIBUYENTE NEGOCIO POPULAR - RÉGIMEN RIMPE' },
    ];

    for (const reg of regimenes) {
        await prisma.regimen.upsert({
            where: { regimenes_nombre: reg.regimenes_nombre },
            update: {},
            create: reg,
        });
    }
    console.log(`   ✅ ${regimenes.length} regímenes`);

    // ─────────────────────────────────────────────────────────────────────────
    // 3. TIPO IDENTIFICACIÓN SRI
    // Datos exactos del legacy
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🪪  Tipos de identificación...');
    const tiposIdentificacion = [
        { codigo: '04', descripcion: 'RUC' },
        { codigo: '05', descripcion: 'Cédula' },
        { codigo: '06', descripcion: 'Pasaporte' },
        { codigo: '07', descripcion: 'Consumidor Final' },
        { codigo: '08', descripcion: 'Identificación del Exterior' },
    ];

    for (const tipo of tiposIdentificacion) {
        await prisma.tipoIdentificacionSri.upsert({
            where: { codigo: tipo.codigo },
            update: { descripcion: tipo.descripcion },
            create: tipo,
        });
    }
    console.log(`   ✅ ${tiposIdentificacion.length} tipos de identificación`);

    // ─────────────────────────────────────────────────────────────────────────
    // 4. TIPO IMPUESTO
    // Datos exactos del legacy — IVA, ICE, IRBPNR
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🧾 Tipos de impuesto...');
    const tiposImpuesto = [
        {
            tipo_impuesto_codigo_sri: '2',
            tipo_impuesto_nombre: 'IVA',
            tipo_impuesto_descripcion: 'Impuesto al Valor Agregado',
        },
        {
            tipo_impuesto_codigo_sri: '3',
            tipo_impuesto_nombre: 'ICE',
            tipo_impuesto_descripcion: 'Impuesto a los Consumos Especiales',
        },
        {
            tipo_impuesto_codigo_sri: '5',
            tipo_impuesto_nombre: 'IRBPNR',
            tipo_impuesto_descripcion: 'Impuesto a los Ingresos de los No Residentes',
        },
    ];

    for (const tipo of tiposImpuesto) {
        await prisma.tipoImpuesto.upsert({
            where: { tipo_impuesto_codigo_sri: tipo.tipo_impuesto_codigo_sri },
            update: {
                tipo_impuesto_nombre: tipo.tipo_impuesto_nombre,
                tipo_impuesto_descripcion: tipo.tipo_impuesto_descripcion,
            },
            create: tipo,
        });
    }
    console.log(`   ✅ ${tiposImpuesto.length} tipos de impuesto`);

    // ─────────────────────────────────────────────────────────────────────────
    // 5. TARIFA IMPUESTO (IVA)
    // Datos exactos del legacy — todas las tarifas del SRI Ecuador
    // Referencia FK: tipo_impuesto_codigo_sri '2' = IVA
    // ─────────────────────────────────────────────────────────────────────────
    console.log('💰 Tarifas de impuesto...');

    // Obtener id del IVA (ya creado arriba)
    // findUniqueOrThrow garantiza que no es null — si no existe, lanza error claro
    const iva = await prisma.tipoImpuesto.findUniqueOrThrow({
        where: { tipo_impuesto_codigo_sri: '2' },
    });

    const tarifas = [
        {
            tarifa_codigo_sri: '0',
            tarifa_porcentaje: 0.00,
            tarifa_nombre: '0%',
            tarifa_descripcion: 'Tasa 0% de IVA',
            tarifa_fecha_inicio: new Date('2025-07-25'),
        },
        {
            tarifa_codigo_sri: '2',
            tarifa_porcentaje: 12.00,
            tarifa_nombre: '12%',
            tarifa_descripcion: 'Tasa 12% de IVA',
            tarifa_fecha_inicio: new Date('2025-07-25'),
        },
        {
            tarifa_codigo_sri: '3',
            tarifa_porcentaje: 14.00,
            tarifa_nombre: '14%',
            tarifa_descripcion: 'Tasa 14% de IVA',
            tarifa_fecha_inicio: new Date('2025-07-25'),
        },
        {
            tarifa_codigo_sri: '4',
            tarifa_porcentaje: 15.00,
            tarifa_nombre: '15%',
            tarifa_descripcion: 'Tasa 15% de IVA',
            tarifa_fecha_inicio: new Date('2025-07-25'),
        },
        {
            tarifa_codigo_sri: '5',
            tarifa_porcentaje: 5.00,
            tarifa_nombre: '5%',
            tarifa_descripcion: 'Tasa 5% de IVA',
            tarifa_fecha_inicio: new Date('2025-07-25'),
        },
        {
            tarifa_codigo_sri: '6',
            tarifa_porcentaje: 0.00,
            tarifa_nombre: 'No Objeto',
            tarifa_descripcion: 'No Objeto de Impuesto',
            tarifa_fecha_inicio: new Date('2025-07-25'),
        },
        {
            tarifa_codigo_sri: '7',
            tarifa_porcentaje: 0.00,
            tarifa_nombre: 'Exento',
            tarifa_descripcion: 'Exento de IVA',
            tarifa_fecha_inicio: new Date('2025-07-25'),
        },
        {
            tarifa_codigo_sri: '8',
            tarifa_porcentaje: 0.00,
            tarifa_nombre: 'Diferenciado',
            tarifa_descripcion: 'IVA diferenciado',
            tarifa_fecha_inicio: new Date('2025-07-25'),
        },
        {
            tarifa_codigo_sri: '10',
            tarifa_porcentaje: 13.00,
            tarifa_nombre: '13%',
            tarifa_descripcion: 'Tasa 13% de IVA',
            tarifa_fecha_inicio: new Date('2025-07-25'),
        },
    ];

    for (const tarifa of tarifas) {
        await prisma.tarifaImpuesto.upsert({
            where: {
                tipo_impuesto_id_tarifa_codigo_sri: {
                    tipo_impuesto_id: iva.tipo_impuesto_id,
                    tarifa_codigo_sri: tarifa.tarifa_codigo_sri,
                },
            },
            update: {
                tarifa_porcentaje: tarifa.tarifa_porcentaje,
                tarifa_nombre: tarifa.tarifa_nombre,
                tarifa_descripcion: tarifa.tarifa_descripcion,
            },
            create: {
                tipo_impuesto_id: iva.tipo_impuesto_id,
                ...tarifa,
            },
        });
    }
    console.log(`   ✅ ${tarifas.length} tarifas de IVA`);

    // ─────────────────────────────────────────────────────────────────────────
    // 6. FORMA DE PAGO
    // Datos exactos del legacy — códigos SRI Ecuador
    // ─────────────────────────────────────────────────────────────────────────
    console.log('💳 Formas de pago...');
    const formasPago = [
        { codigo: '01', nombre: 'SIN UTILIZACIÓN DEL SISTEMA FINANCIERO' },
        { codigo: '15', nombre: 'COMPENSACIÓN DE DEUDAS' },
        { codigo: '16', nombre: 'TARJETA DE DÉBITO' },
        { codigo: '17', nombre: 'DINERO ELECTRÓNICO' },
        { codigo: '18', nombre: 'TARJETA PREPAGO' },
        { codigo: '19', nombre: 'TARJETA DE CRÉDITO' },
        { codigo: '20', nombre: 'OTROS CON UTILIZACIÓN DEL SISTEMA FINANCIERO' },
        { codigo: '21', nombre: 'ENDOSO DE TÍTULOS' },
    ];

    for (const fp of formasPago) {
        await prisma.formaPago.upsert({
            where: { codigo: fp.codigo },
            update: { nombre: fp.nombre },
            create: fp,
        });
    }
    console.log(`   ✅ ${formasPago.length} formas de pago`);

    // ─────────────────────────────────────────────────────────────────────────
    // 7. TIPO COMPROBANTE
    // Datos exactos del legacy — comprobantes SRI Ecuador
    // ─────────────────────────────────────────────────────────────────────────
    console.log('📄 Tipos de comprobante...');
    const tiposComprobante = [
        { codigo: '00', nombre: 'COMPROBANTE DE VENTA', abreviatura: 'COV' },
        { codigo: '01', nombre: 'FACTURA', abreviatura: 'FAC' },
        { codigo: '03', nombre: 'LIQUIDACIÓN DE COMPRA DE BIENES Y PRESTACIÓN DE SERVICIOS', abreviatura: 'LIC' },
        { codigo: '04', nombre: 'NOTA DE CRÉDITO', abreviatura: 'NOC' },
        { codigo: '05', nombre: 'NOTA DE DÉBITO', abreviatura: 'NOD' },
        { codigo: '06', nombre: 'GUÍA DE REMISIÓN', abreviatura: 'GUR' },
        { codigo: '07', nombre: 'COMPROBANTE DE RETENCIÓN', abreviatura: 'COR' },
    ];

    for (const tc of tiposComprobante) {
        await prisma.tipoComprobante.upsert({
            where: { codigo: tc.codigo },
            update: { nombre: tc.nombre, abreviatura: tc.abreviatura },
            create: tc,
        });
    }
    console.log(`   ✅ ${tiposComprobante.length} tipos de comprobante`);

    // ─────────────────────────────────────────────────────────────────────────
    // 8. ESTADO SRI
    // Datos exactos del legacy — ciclo de vida de una factura electrónica
    // ─────────────────────────────────────────────────────────────────────────
    console.log('📡 Estados SRI...');
    const estadosSri = [
        { codigo: 'PENDIENTE', descripcion: 'Factura generada pero aún no enviada al SRI' },
        { codigo: 'ENVIADA', descripcion: 'Factura enviada al SRI, esperando validación' },
        { codigo: 'RECIBIDA', descripcion: 'Comprobante recibido por el SRI' },
        { codigo: 'DEVUELTA', descripcion: 'Factura devuelta por errores en estructura o validación' },
        { codigo: 'AUTORIZADO', descripcion: 'Factura aprobada por el SRI' },
        { codigo: 'RECHAZADA', descripcion: 'Factura rechazada definitivamente por el SRI' },
        { codigo: 'ANULADA', descripcion: 'Factura anulada internamente por el emisor' },
    ];

    for (const estado of estadosSri) {
        await prisma.estadoSri.upsert({
            where: { codigo: estado.codigo },
            update: { descripcion: estado.descripcion },
            create: estado,
        });
    }
    console.log(`   ✅ ${estadosSri.length} estados SRI`);

    // ─────────────────────────────────────────────────────────────────────────
    // 9. ESTADOS NUMERACIÓN
    // Datos exactos del legacy — ciclo de vida de un número de factura
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🔢 Estados de numeración...');
    const estadosNumeracion = [
        { estado_nombre: 'LIBRE' },
        { estado_nombre: 'OCUPADO' },
        { estado_nombre: 'USADO' },
        { estado_nombre: 'RESERVADO' },
    ];

    for (const en of estadosNumeracion) {
        await prisma.estadoNumeracion.upsert({
            where: { estado_nombre: en.estado_nombre },
            update: {},
            create: en,
        });
    }
    console.log(`   ✅ ${estadosNumeracion.length} estados de numeración`);

    // ─────────────────────────────────────────────────────────────────────────
    // 10. TIPO ITEM
    // Datos exactos del legacy
    // ─────────────────────────────────────────────────────────────────────────
    console.log('📦 Tipos de item...');
    const tiposItem = [
        { tipo_item_nombre: 'Producto', tipo_item_descripcion: 'Ítems físicos con inventario' },
        { tipo_item_nombre: 'Servicio', tipo_item_descripcion: 'Servicios que no manejan inventario' },
    ];

    for (const ti of tiposItem) {
        await prisma.tipoItem.upsert({
            where: { tipo_item_nombre: ti.tipo_item_nombre },
            update: { tipo_item_descripcion: ti.tipo_item_descripcion },
            create: ti,
        });
    }
    console.log(`   ✅ ${tiposItem.length} tipos de item`);

    // ─────────────────────────────────────────────────────────────────────────
    // 11. PLANES
    // TRIAL  → plan de prueba público, límites conservadores
    // OWNED  → plan interno sin límites, oculto al público (plan_visible = false)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('💎 Planes...');
    const planes = [
        {
            plan_nombre: 'TRIAL',
            plan_descripcion: 'Plan de prueba gratuito con funcionalidad limitada',
            plan_precio: 0.00,
            plan_moneda: 'USD',
            max_usuarios: 1,
            max_sucursales: 1,
            max_facturas_mes: 30,
            max_items: 50,
            plan_activo: true,
            plan_visible: true,
        },
        {
            plan_nombre: 'OWNED',
            plan_descripcion: 'Plan interno sin restricciones — uso exclusivo del propietario del sistema',
            plan_precio: 0.00,
            plan_moneda: 'USD',
            max_usuarios: -1,   // -1 = sin límite
            max_sucursales: -1,
            max_facturas_mes: -1,
            max_items: -1,
            plan_activo: true,
            plan_visible: false, // No aparece en listados públicos de planes
        },
    ];

    for (const plan of planes) {
        await prisma.plan.upsert({
            where: { plan_nombre: plan.plan_nombre },
            update: {
                plan_descripcion: plan.plan_descripcion,
                max_usuarios: plan.max_usuarios,
                max_sucursales: plan.max_sucursales,
                max_facturas_mes: plan.max_facturas_mes,
                max_items: plan.max_items,
                plan_activo: plan.plan_activo,
                plan_visible: plan.plan_visible,
            },
            create: plan,
        });
    }
    console.log(`   ✅ ${planes.length} planes`);
    // ─────────────────────────────────────────────────────────────────────────
    // 12. TIPOS DE DOCUMENTO DE COMPRA
    // ─────────────────────────────────────────────────────────────────────────
    console.log('📑 Tipos de documento de compra...');
    await prisma.tipoDocumentoCompra.createMany({
        data: [
            { tipo_doc_codigo: 'FAC', tipo_doc_nombre: 'Factura' },
            { tipo_doc_codigo: 'COMP', tipo_doc_nombre: 'Comprobante' },
            { tipo_doc_codigo: 'PROF', tipo_doc_nombre: 'Proforma' },
            { tipo_doc_codigo: 'LIQ', tipo_doc_nombre: 'Liquidación de Compra' },
            { tipo_doc_codigo: 'NE', tipo_doc_nombre: 'Nota de Entrega' },
        ],
        skipDuplicates: true,
    });
    console.log(`   ✅ 5 tipos de documento de compra`);

    // ─────────────────────────────────────────────────────────────────────────
    // 13. ESTADOS DE PAGO DE COMPRA
    // ─────────────────────────────────────────────────────────────────────────
    console.log('💰 Estados de pago de compra...');
    await prisma.estadoPagoCompra.createMany({
        data: [
            { estado_pago_codigo: 'PENDIENTE', estado_pago_nombre: 'Pendiente de pago' },
            { estado_pago_codigo: 'PARCIAL', estado_pago_nombre: 'Parcialmente pagado' },
            { estado_pago_codigo: 'PAGADO', estado_pago_nombre: 'Pagado' },
        ],
        skipDuplicates: true,
    });
    console.log(`   ✅ 3 estados de pago de compra`);

    // ─────────────────────────────────────────────────────────────────────────
    // 14. PAÍSES (más comunes)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🌍 Países...');
    await prisma.pais.createMany({
        data: [
            { codigo_iso: 'ECU', codigo_iso2: 'EC', nombre: 'Ecuador' },
            { codigo_iso: 'COL', codigo_iso2: 'CO', nombre: 'Colombia' },
            { codigo_iso: 'PER', codigo_iso2: 'PE', nombre: 'Perú' },
            { codigo_iso: 'USA', codigo_iso2: 'US', nombre: 'Estados Unidos' },
            { codigo_iso: 'CHN', codigo_iso2: 'CN', nombre: 'China' },
            { codigo_iso: 'ESP', codigo_iso2: 'ES', nombre: 'España' },
            { codigo_iso: 'MEX', codigo_iso2: 'MX', nombre: 'México' },
            { codigo_iso: 'BRA', codigo_iso2: 'BR', nombre: 'Brasil' },
            { codigo_iso: 'ARG', codigo_iso2: 'AR', nombre: 'Argentina' },
            { codigo_iso: 'CHL', codigo_iso2: 'CL', nombre: 'Chile' },
        ],
        skipDuplicates: true,
    });
    console.log(`   ✅ 10 países`);

    // ─────────────────────────────────────────────────────────────────────────
    // RESUMEN FINAL
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n✅ Seed completado exitosamente.');
    console.log('────────────────────────────────────────');
    console.log(`   Roles:                    ${roles.length}`);
    console.log(`   Regímenes:                ${regimenes.length}`);
    console.log(`   Tipos identificación:     ${tiposIdentificacion.length}`);
    console.log(`   Tipos impuesto:           ${tiposImpuesto.length}`);
    console.log(`   Tarifas IVA:              ${tarifas.length}`);
    console.log(`   Formas de pago:           ${formasPago.length}`);
    console.log(`   Tipos comprobante:        ${tiposComprobante.length}`);
    console.log(`   Estados SRI:              ${estadosSri.length}`);
    console.log(`   Estados numeración:       ${estadosNumeracion.length}`);
    console.log(`   Tipos de item:            ${tiposItem.length}`);
    console.log(`   Planes:                   ${planes.length}`);
    console.log(`   Tipos doc. compra:        5`);
    console.log(`   Estados pago compra:      3`);
    console.log(`   Países:                   10`);
    console.log('────────────────────────────────────────');



}


main()
    .catch((e) => {
        console.error('❌ Error durante el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });