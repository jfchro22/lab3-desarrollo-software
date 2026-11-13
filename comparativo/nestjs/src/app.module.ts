import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth/auth.controller';
import { CursosController } from './cursos/cursos.controller';
import { DbService } from './db.service';

@Module({
  // [auth:inicio]
  imports: [JwtModule.register({ global: true, secret: process.env.JWT_SECRET ?? 'cambiar-en-produccion-comparativo' })],
  // [auth:fin]
  controllers: [AuthController, CursosController],
  providers: [DbService],
})
export class AppModule {}
