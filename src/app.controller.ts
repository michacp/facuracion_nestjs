// src/app.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import * as path from 'path';
import type { Response } from 'express';

@Controller()
export class AppController {
  @Get()
  @ApiExcludeEndpoint()
  root(@Res() res: Response) {
    // Detectamos si estamos en desarrollo o producción
    const isDev = process.env.NODE_ENV !== 'production';

    let filePath: string;

    if (isDev) {
      // En desarrollo: usamos la raíz del proyecto + src/public
      filePath = path.join(process.cwd(), 'src', 'public', 'index.html');
    } else {
      // En producción (después de nest build): asumimos que public se copió a dist/public
      filePath = path.join(__dirname, '..', 'public', 'index.html');
    }

    // Opcional: manejo de error más amigable
    return res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error al enviar index.html:', err);
        return res.status(404).json({
          statusCode: 404,
          message: 'Página de bienvenida no encontrada',
          error: 'Not Found',
          path: filePath,  // ← útil para debug
        });
      }
    });
  }
}