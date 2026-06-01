import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
// ✅ HttpsOptions es el tipo propio de NestJS — NO usar https.ServerOptions de Node
import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import morgan from 'morgan';
import { GoogleDriveService } from './google-drive/google-drive.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // ─────────────────────────────────────────
  // 🔐 Certificados HTTPS
  // ─────────────────────────────────────────
  let httpsOptions: HttpsOptions | undefined;

  try {
    httpsOptions = {
      key: fs.readFileSync('/etc/letsencrypt/live/api.teamcellmania.com/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/api.teamcellmania.com/fullchain.pem'),
    };
    logger.log('🔐 Certificados Let\'s Encrypt cargados.');
  } catch {
    try {
      httpsOptions = {
        key: fs.readFileSync('src/keys/localhost-key.pem'),
        cert: fs.readFileSync('src/keys/localhost-cert.pem'),
        // Se fuerza el tipado aquí para que NestJS acepte las propiedades nativas de Node.js
        secureOptions: require('constants').SSL_OP_NO_TLSv1 | require('constants').SSL_OP_NO_TLSv1_1,
      } as HttpsOptions;
      logger.log('🔐 Certificados localhost cargados.');
    } catch (error: any) {
      logger.error(`❌ Error cargando certificados: ${error.message}`);
      process.exit(1);
    }
  }

  // ─────────────────────────────────────────
  // 🏗️ Crear aplicación
  // ─────────────────────────────────────────
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
    // NestJS usa su propio logger, equivalente a morgan 'dev'
    logger: ['log', 'warn', 'error', 'debug', 'verbose'],
  });
  // ─────────────────────────────────────────
  // 📝 MORGAN - Logging de peticiones HTTP
  // ─────────────────────────────────────────
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    app.use(morgan('dev'));           // Formato bonito y coloreado
    logger.log('📊 Morgan activado en modo DESARROLLO (dev)');
  } else {
    app.use(morgan('combined'));      // Formato estándar para producción
    logger.log('📊 Morgan activado en modo PRODUCCIÓN (combined)');
  }
  // ─────────────────────────────────────────
  // 🔧 CORS
  // ─────────────────────────────────────────
  const allowedOrigins = [
    'http://localhost:60949',
    'http://localhost:4202',
    'http://localhost:4000',
    'http://localhost:55099',
    'http://localhost:4200',
    'https://facturacion-7bde0.web.app',
    'https://facturacion-7bde0.firebaseapp.com',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ─────────────────────────────────────────
  // ✅ Validación global de DTOs
  // ─────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Strip propiedades no declaradas en el DTO
      forbidNonWhitelisted: true,
      transform: true,        // Auto-cast de tipos (string → number, etc.)
    }),
  );

  // ─────────────────────────────────────────
  // 📚 Swagger — disponible en todos los entornos
  // UI:   /api/docs
  // JSON: /api/docs-json
  // ─────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Inventario API')
    .setDescription(
      '## API multi-tenant para gestión de inventario y facturación electrónica SRI Ecuador\n\n' +
      '### Autenticación\n' +
      'Todos los endpoints (excepto `POST /auth/login`) requieren JWT Bearer token.\n' +
      'Obtén tu token en `POST /auth/login` e inclúyelo en el header `Authorization: Bearer <token>`.\n\n' +
      '### Multi-tenant\n' +
      'El `empresa_id` del tenant activo se extrae automáticamente del JWT. ' +
      'No es necesario enviarlo en los requests.'
    )
    .setVersion('2.0.0')
    .setContact('TeamCellMania', 'https://api.teamcellmania.com', '')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingresa el JWT obtenido en POST /auth/login',
      },
      'JWT',
    )
    // ── Tags por módulo (orden en que aparecen en Swagger UI) ──
    .addTag('auth', '🔐 Login y gestión de sesión')
    .addTag('usuarios', '👤 Usuarios por empresa')
    .addTag('empresas', '🏢 Gestión de empresas (SUPERADMIN)')
    .addTag('suscripciones', '📋 Planes y suscripciones (SUPERADMIN)')
    .addTag('sucursales', '🏪 Sucursales y puntos de emisión')
    .addTag('firmas', '✍️  Certificados digitales p12')
    .addTag('clientes', '👥 Clientes del tenant')
    .addTag('items', '📦 Productos y servicios')
    .addTag('brands', '📱 Marcas de dispositivos')
    .addTag('models', '📱 Modelos de dispositivos')
    .addTag('ventas', '🧾 Ventas')
    .addTag('facturas', '⚡ Facturación electrónica SRI')
    .addTag('catalogos', '🗂️  Catálogos globales (solo lectura)')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    customSiteTitle: 'TeamCellMania API Docs',
    swaggerOptions: {
      persistAuthorization: true,       // Mantiene el token entre recargas
      displayRequestDuration: true,     // Muestra tiempo de respuesta
      filter: true,                     // Búsqueda por endpoint
      tryItOutEnabled: true,            // Habilita 'Try it out' por defecto
      defaultModelsExpandDepth: 1,
    },
  });

  logger.log('📚 Swagger UI disponible en /api/docs');
  logger.log('📄 OpenAPI JSON disponible en /api/docs-json');

  // ─────────────────────────────────────────
  // 🚀 Arranque
  // ─────────────────────────────────────────
  const PORT = process.env.PORT ?? 3950;
  await app.listen(PORT);
  logger.log(`✅ Servidor HTTPS corriendo en https://localhost:${PORT}`);

  // ─────────────────────────────────────────
  // 🔑 Verificar token Google Drive al arrancar
  // ─────────────────────────────────────────
  try {
    const googleDriveService = app.get(GoogleDriveService);
    await googleDriveService.verifyToken();
  } catch (err: any) {
    logger.warn(`⚠️  Token de Google Drive inválido: ${err.message}`);
    logger.warn('   Ejecuta: npx ts-node src/google-drive/generate-token.ts');
  }
}

bootstrap();