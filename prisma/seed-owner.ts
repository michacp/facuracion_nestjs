// prisma/seed-owner.ts
//
// Crea la empresa propietaria del sistema (contecinfor) con su usuario SUPERADMIN.
// Idempotente: usa upsert en cada paso — seguro ejecutarlo más de una vez.
//
// Ejecutar:
//   npx tsx prisma/seed-owner.ts
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('❌ DATABASE_URL no está definida en .env');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ─── Constantes ──────────────────────────────────────────────────────────────

const OWNER = {
    empresa: {
        razonSocial: 'CONTECINFOR',
        nombreComercial: 'Contecinfor',
        ruc: '0190512345001',   // RUC ficticio válido en formato (13 dígitos)
        dirMatriz: 'Av. de las Américas y Elia Liut, Cuenca, Azuay',
        telefono: '+593 7 400 0000',
        email: 'admin@contecinfor.com',
        obligadoContabilidad: false,
        agenteRetencion: false,
    },
    sucursal: {
        cod: '001',
        nombre: 'MATRIZ',
        direccion: 'Av. de las Américas y Elia Liut, Cuenca, Azuay',
        telefono: '+593 7 400 0000',
        esMatriz: true,
    },
    usuario: {
        username: 'admin.contecinfor',
        nombre: 'Administrador Contecinfor',
        email: 'admin@contecinfor.com',
        password: 'oldtwesol980',   // ← se hashea antes de guardar
        activo: true,
    },
    // Rol con acceso global (definido en seed.ts)
    rolNombre: 'SUPERADMIN',
    // Plan sin restricciones para el propietario (definido en seed.ts)
    planNombre: 'OWNED',
    // Régimen "NO" para empresas sin actividad tributaria definida
    regimenNombre: 'NO',
};

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    console.log('🏢 Creando empresa propietaria del sistema...\n');

    // ── 1. Prerequisitos (deben existir desde seed.ts) ────────────────────────
    const plan = await prisma.plan.findUniqueOrThrow({
        where: { plan_nombre: OWNER.planNombre },
    });
    const rol = await prisma.role.findUniqueOrThrow({
        where: { rol_nombre: OWNER.rolNombre },
    });
    const regimen = await prisma.regimen.findUniqueOrThrow({
        where: { regimenes_nombre: OWNER.regimenNombre },
    });

    console.log(`   ✅ Plan "${plan.plan_nombre}" encontrado  (id: ${plan.plan_id})`);
    console.log(`   ✅ Rol  "${rol.rol_nombre}"  encontrado  (id: ${rol.rol_id})`);
    console.log(`   ✅ Régimen "${regimen.regimenes_nombre}" encontrado  (id: ${regimen.regimenes_id})\n`);

    // ── 2. Empresa ─────────────────────────────────────────────────────────────
    console.log('🏛️  Empresa...');
    const empresa = await prisma.empresa.upsert({
        where: { empresas_ruc: OWNER.empresa.ruc },
        update: {
            empresas_razonSocial: OWNER.empresa.razonSocial,
            empresas_nombreComercial: OWNER.empresa.nombreComercial,
            empresas_dirMatriz: OWNER.empresa.dirMatriz,
            empresas_telefono: OWNER.empresa.telefono,
            empresa_email: OWNER.empresa.email,
            empresas_obligadocontabilidad: OWNER.empresa.obligadoContabilidad,
            empresas_agenteRetencion: OWNER.empresa.agenteRetencion,
            empresas_regimenes_id: regimen.regimenes_id,
        },
        create: {
            empresas_razonSocial: OWNER.empresa.razonSocial,
            empresas_nombreComercial: OWNER.empresa.nombreComercial,
            empresas_ruc: OWNER.empresa.ruc,
            empresas_dirMatriz: OWNER.empresa.dirMatriz,
            empresas_telefono: OWNER.empresa.telefono,
            empresa_email: OWNER.empresa.email,
            empresas_obligadocontabilidad: OWNER.empresa.obligadoContabilidad,
            empresas_agenteRetencion: OWNER.empresa.agenteRetencion,
            empresas_activa: true,
            empresas_regimenes_id: regimen.regimenes_id,
        },
    });
    console.log(`   ✅ Empresa creada  (id: ${empresa.empresas_id})`);

    // ── 3. Suscripción OWNED ───────────────────────────────────────────────────
    console.log('💎 Suscripción...');
    const hoy = new Date();
    const sinVencer = new Date('2099-12-31');

    await prisma.suscripcion.upsert({
        where: { empresa_id: empresa.empresas_id },
        update: {
            plan_id: plan.plan_id,
            estado: 'ACTIVA',
            fecha_inicio: hoy,
            fecha_vencimiento: sinVencer,
            renovacion_automatica: true,
        },
        create: {
            empresa_id: empresa.empresas_id,
            plan_id: plan.plan_id,
            estado: 'ACTIVA',
            fecha_inicio: hoy,
            fecha_vencimiento: sinVencer,
            renovacion_automatica: true,
        },
    });
    console.log(`   ✅ Suscripción OWNED — vigente hasta 2099-12-31`);

    // ── 4. Sucursal MATRIZ ─────────────────────────────────────────────────────
    console.log('🏪 Sucursal...');
    await prisma.sucursal.upsert({
        where: {
            sucursales_empresaId_sucursales_cod: {
                sucursales_empresaId: empresa.empresas_id,
                sucursales_cod: OWNER.sucursal.cod,
            },
        },
        update: {
            sucursales_nombre: OWNER.sucursal.nombre,
            sucursales_direccion: OWNER.sucursal.direccion,
            sucursales_telefono: OWNER.sucursal.telefono,
            sucursales_esMatriz: OWNER.sucursal.esMatriz,
        },
        create: {
            sucursales_empresaId: empresa.empresas_id,
            sucursales_cod: OWNER.sucursal.cod,
            sucursales_nombre: OWNER.sucursal.nombre,
            sucursales_direccion: OWNER.sucursal.direccion,
            sucursales_telefono: OWNER.sucursal.telefono,
            sucursales_esMatriz: OWNER.sucursal.esMatriz,
        },
    });
    console.log(`   ✅ Sucursal "${OWNER.sucursal.nombre}" creada`);

    // ── 5. Usuario ─────────────────────────────────────────────────────────────
    console.log('👤 Usuario...');
    const hash = await bcrypt.hash(OWNER.usuario.password, 12);

    const usuario = await prisma.usuario.upsert({
        where: { usuarios_email: OWNER.usuario.email },
        update: {
            usuarios_nombre: OWNER.usuario.nombre,
            usuarios_username: OWNER.usuario.username,
            usuarios_activo: OWNER.usuario.activo,
            // ⚠️  Solo actualiza el hash si quieres resetear la contraseña.
            // Comenta la siguiente línea para no sobreescribir una contraseña cambiada.
            usuarios_password: hash,
        },
        create: {
            usuarios_username: OWNER.usuario.username,
            usuarios_nombre: OWNER.usuario.nombre,
            usuarios_email: OWNER.usuario.email,
            usuarios_password: hash,
            usuarios_activo: OWNER.usuario.activo,
        },
    });
    console.log(`   ✅ Usuario "${usuario.usuarios_username}" creado  (id: ${usuario.usuarios_id})`);

    // ── 6. UsuarioEmpresa — vincula usuario ↔ empresa con rol SUPERADMIN ──────
    console.log('🔗 Vinculando usuario ↔ empresa...');
    await prisma.usuarioEmpresa.upsert({
        where: {
            usuario_empresa_usuarioId_usuario_empresa_empresaId: {
                usuario_empresa_usuarioId: usuario.usuarios_id,
                usuario_empresa_empresaId: empresa.empresas_id,
            },
        },
        update: {
            usuario_empresa_rolId: rol.rol_id,
            usuario_empresa_codEmi: '001',
        },
        create: {
            usuario_empresa_usuarioId: usuario.usuarios_id,
            usuario_empresa_empresaId: empresa.empresas_id,
            usuario_empresa_rolId: rol.rol_id,
            usuario_empresa_codEmi: '001',
        },
    });
    console.log(`   ✅ Vínculo creado con rol "${OWNER.rolNombre}"`);

    // ── Resumen ────────────────────────────────────────────────────────────────
    console.log('\n✅ Setup del propietario completado.');
    console.log('────────────────────────────────────────────────────');
    console.log(`   Empresa:    ${empresa.empresas_razonSocial}  (RUC: ${empresa.empresas_ruc})`);
    console.log(`   Plan:       ${plan.plan_nombre}`);
    console.log(`   Suscripción: ACTIVA — sin vencimiento`);
    console.log(`   Sucursal:   ${OWNER.sucursal.nombre}  (cod: ${OWNER.sucursal.cod})`);
    console.log(`   Usuario:    ${usuario.usuarios_email}`);
    console.log(`   Rol:        ${OWNER.rolNombre}`);
    console.log('────────────────────────────────────────────────────');
    console.log('\n⚠️  Guarda estas credenciales en un lugar seguro:');
    console.log(`   Email:      ${OWNER.usuario.email}`);
    console.log(`   Contraseña: ${OWNER.usuario.password}`);
    console.log('────────────────────────────────────────────────────\n');
}

main()
    .catch((e) => {
        console.error('❌ Error durante seed-owner:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });