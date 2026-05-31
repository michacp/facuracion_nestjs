import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiAuthLogin } from './docs/login.doc'; // <-- Importamos tu doc limpia

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiAuthLogin() // <-- Toda la metadata de Swagger concentrada aquí
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}