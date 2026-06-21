import {
    Controller, Get, Post, Body, Patch, HttpCode,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EmpresaService } from './empresa.service';
import { Auth, CurrentUser } from '../auth/decorators';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { GetEmpresaProfileDoc } from './docs/get-empresa-profile.doc';
import { UpdateEmpresaDoc } from './docs/update-empresa.doc';
import { UpdateEmpresaBodyDto } from './dto/request/update-empresa-body.dto';
import { SaveSucursalBodyDto } from './dto/request/save-sucursal-body.dto';
import { SaveUsuarioEmpresaBodyDto } from './dto/request/save-usuario-empresa-body.dto';
import type { EmpresaProfileResponseDto } from './dto/response/empresa-profile-response.dto';
import { DeleteUsuarioEmpresaBodyDto } from './dto/request/delete-usuario-empresa-body.dto';
import { DeleteSucursalBodyDto } from './dto/request/delete-sucursal-body.dto';
import { GetMiPerfilDoc } from './docs/mi-perfil.doc';
import { MiPerfilResponseDto } from './dto/response/mi-perfil-response.dto';
import { UpdateMiPerfilDoc } from './docs/update-mi-perfil.doc';
import { UpdateMiPerfilBodyDto } from './dto/request/update-mi-perfil-body.dto';
import { CambiarPasswordDoc } from './docs/cambiar-password.doc';
import { CambiarPasswordBodyDto } from './dto/request/cambiar-password-body.dto';

@ApiTags('Empresa')
@Controller('empresa')
export class EmpresaController {
    constructor(private readonly empresaService: EmpresaService) { }

    // ── GET perfil completo ───────────────────────────────────────────────
    @Get('profile')
    @Auth()
    @GetEmpresaProfileDoc()
    async getProfile(
        @CurrentUser() user: JwtPayload,
    ): Promise<EmpresaProfileResponseDto> {
        return this.empresaService.getProfile(user);
    }

    // ── POST actualizar empresa ───────────────────────────────────────────
    @Post('update')
    @Auth('ADMINISTRADOR')
    @UpdateEmpresaDoc()
    @HttpCode(200)
    async update(
        @Body() body: UpdateEmpresaBodyDto,
        @CurrentUser() user: JwtPayload,
    ): Promise<void> {
        return this.empresaService.updateEmpresa(body, user);
    }

    // ── POST guardar sucursal (crear o editar) ────────────────────────────
    @Post('sucursal/save')
    @Auth('ADMINISTRADOR')
    @HttpCode(200)
    async saveSucursal(
        @Body() body: SaveSucursalBodyDto,
        @CurrentUser() user: JwtPayload,
    ): Promise<void> {
        return this.empresaService.saveSucursal(body, user);
    }

    // ── POST guardar usuario (crear o editar vínculo) ─────────────────────
    @Post('usuario/save')
    @Auth('ADMINISTRADOR')
    @HttpCode(200)
    async saveUsuario(
        @Body() body: SaveUsuarioEmpresaBodyDto,
        @CurrentUser() user: JwtPayload,
    ): Promise<void> {
        return this.empresaService.saveUsuario(body, user);
    }

    // ── POST toggle activo/inactivo de usuario ────────────────────────────
    @Post('usuario/toggle-activo')
    @Auth('ADMINISTRADOR')
    @HttpCode(200)
    async toggleUsuarioActivo(
        @Body() body: { usuario_empresa_id: number },
        @CurrentUser() user: JwtPayload,
    ): Promise<void> {
        return this.empresaService.toggleUsuarioActivo(body.usuario_empresa_id, user);
    }

    // ── POST eliminar sucursal ────────────────────────────────────────────
    @Post('sucursal/delete')
    @Auth('ADMINISTRADOR')
    @HttpCode(200)
    async deleteSucursal(
        @Body() body: DeleteSucursalBodyDto,
        @CurrentUser() user: JwtPayload,
    ): Promise<void> {
        return this.empresaService.deleteSucursal(body, user);
    }

    // ── POST eliminar vínculo usuario-empresa ─────────────────────────────
    @Post('usuario/delete')
    @Auth('ADMINISTRADOR')
    @HttpCode(200)
    async deleteUsuarioEmpresa(
        @Body() body: DeleteUsuarioEmpresaBodyDto,
        @CurrentUser() user: JwtPayload,
    ): Promise<void> {
        return this.empresaService.deleteUsuarioEmpresa(body, user);
    }

    // ── GET mi perfil ────────────────────────────────────────────────────
    @Get('mi-perfil')
    @Auth() // cualquier usuario autenticado, sin restricción de rol
    @GetMiPerfilDoc()
    async getMiPerfil(
        @CurrentUser() user: JwtPayload,
    ): Promise<MiPerfilResponseDto> {
        return this.empresaService.getMiPerfil(user);
    }

    // ── POST actualizar mi perfil ───────────────────────────────────────
    @Post('mi-perfil/update')
    @Auth()
    @UpdateMiPerfilDoc()
    @HttpCode(200)
    async updateMiPerfil(
        @Body() body: UpdateMiPerfilBodyDto,
        @CurrentUser() user: JwtPayload,
    ): Promise<void> {
        return this.empresaService.updateMiPerfil(body, user);
    }

    // ── POST cambiar mi contraseña ──────────────────────────────────────
    @Post('mi-perfil/cambiar-password')
    @Auth()
    @CambiarPasswordDoc()
    @HttpCode(200)
    async cambiarPassword(
        @Body() body: CambiarPasswordBodyDto,
        @CurrentUser() user: JwtPayload,
    ): Promise<void> {
        return this.empresaService.cambiarPassword(body, user);
    }
}