# ENDPOINTS.md — Referencia de Endpoints

> **Base URL producción:** `https://api.teamcellmania.com`  
> **Base URL desarrollo:** `https://localhost:3950`  
> **Documentación interactiva:** `GET /api/docs` (Swagger UI)  
> **OpenAPI JSON:** `GET /api/docs-json`

---

## Convenciones

### Autenticación
Todos los endpoints excepto `POST /auth/login` requieren JWT en el header:
```
Authorization: Bearer <token>
```

### Respuestas de error estándar

| Status | Cuándo |
|---|---|
| `400` | Datos de entrada inválidos (falla validación del DTO) |
| `401` | Token ausente, inválido o expirado |
| `403` | Sin permisos para esa acción (rol insuficiente o suscripción inactiva) |
| `404` | Recurso no encontrado |
| `409` | Conflicto — el recurso ya existe (ej: RUC duplicado) |
| `500` | Error interno del servidor |

### Tenant automático
El `empresa_id` del tenant activo **nunca se envía en el body** — se extrae automáticamente del JWT. Los datos devueltos siempre pertenecen al tenant del usuario autenticado.

---

## Índice

- [GET /](#get-)
- [Próximos endpoints](#próximos-endpoints)

---

## `GET /`

**Descripción:** Página de bienvenida de la API. Muestra el estado del servicio, los módulos disponibles y un acceso directo a la documentación Swagger.

**Autenticación:** No requerida — endpoint público.

**Controller:** `AppController` → `src/app.controller.ts`  
**Archivo HTML:** `src/public/index.html`

### Request

```
GET /
```

Sin headers requeridos. Sin body. Sin query params.

### Response

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
```

Retorna el archivo `src/public/index.html` — página HTML estilizada con:
- Badge de estado del servicio (activo / versión / stack)
- Tarjetas por módulo con sus endpoints principales
- Indicador de scope por módulo (Global / Tenant / SUPERADMIN)
- Botones de acceso a Swagger UI y OpenAPI JSON

### Implementación

```typescript
// src/app.controller.ts
@Get()
@ApiExcludeEndpoint()   // No aparece en Swagger — es HTML, no datos
root(@Res() res: Response) {
  return res.sendFile(
    path.join(__dirname, '..', 'public', 'index.html'),
  );
}
```

**Por qué `path.join(__dirname, '..', 'public')`:**  
En desarrollo `__dirname` apunta a `src/`. En producción (después de `npm run build`) apunta a `dist/`. El `..` sube un nivel y `public/` busca la carpeta de archivos estáticos. NestJS copia `src/public/` a `dist/public/` durante el build si se configura en `tsconfig.json`.

> **Nota de build:** Agregar en `nest-cli.json` la siguiente configuración para que los archivos estáticos se copien al compilar:
> ```json
> {
>   "compilerOptions": {
>     "assets": [{ "include": "public/**/*", "watchAssets": true }]
>   }
> }
> ```

### Notas

- Este endpoint **no se documenta en Swagger** (`@ApiExcludeEndpoint`) porque devuelve HTML, no JSON.
- El HTML no hace calls a la API — es puramente informativo/estático.
- La lista de endpoints mostrados en el HTML se actualiza manualmente al agregar nuevos módulos.

---

## Próximos endpoints

A medida que se migran las rutas del legacy, se documentan aquí en orden:

| Endpoint | Módulo | Estado |
|---|---|---|
| `POST /auth/login` | AuthModule | ⏳ Siguiente |
| `POST /auth/refresh` | AuthModule | ⏳ Pendiente |
| `GET /catalogos/formas-pago` | CatalogosModule | ⏳ Pendiente |
| `GET /catalogos/tarifas` | CatalogosModule | ⏳ Pendiente |
| `GET /catalogos/comprobantes` | CatalogosModule | ⏳ Pendiente |
| `GET /catalogos/tipos-identificacion` | CatalogosModule | ⏳ Pendiente |
| `GET /brands` | BrandsModule | ⏳ Pendiente |
| `GET /models` | ModelsModule | ⏳ Pendiente |
| `GET /empresas` | EmpresasModule | ⏳ Pendiente |
| `POST /empresas` | EmpresasModule | ⏳ Pendiente |
| `GET /sucursales` | SucursalesModule | ⏳ Pendiente |
| `GET /clientes` | ClientesModule | ⏳ Pendiente |
| `POST /clientes` | ClientesModule | ⏳ Pendiente |
| `GET /items` | ItemsModule | ⏳ Pendiente |
| `POST /ventas` | VentasModule | ⏳ Pendiente |
| `POST /facturas` | FacturasModule | ⏳ Pendiente |
