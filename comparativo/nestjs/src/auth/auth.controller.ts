import { Body, Controller, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { DbService } from '../db.service';

class LoginDto {
  @IsEmail({}, { message: 'El correo no es válido.' }) email: string;
  @IsString({ message: 'La contraseña es obligatoria.' }) password: string;
}

@ApiTags('Autenticación')
@Controller('login')
export class AuthController {
  constructor(private d: DbService, private jwt: JwtService) {}

  @Post()
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const u: any = this.d.db.prepare('SELECT id,name,email,password,role FROM users WHERE email = ?').get(dto.email);
    if (!u || !(await bcrypt.compare(dto.password, u.password))) {
      throw new UnauthorizedException({ message: 'Credenciales incorrectas.' });
    }
    const expira = new Date(Date.now() + 2 * 3600 * 1000);
    const token = await this.jwt.signAsync({ sub: u.id, role: u.role }, { expiresIn: '2h' });
    return { usuario: { id: u.id, name: u.name, email: u.email, role: u.role }, token, expira_en: expira.toISOString() };
  }
}
