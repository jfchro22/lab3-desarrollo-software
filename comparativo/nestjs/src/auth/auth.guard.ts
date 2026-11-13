import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

export const SoloAdmin = () => SetMetadata('soloAdmin', true);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwt: JwtService, private reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const token = (req.headers['authorization'] ?? '').replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException({ message: 'No autenticado.' });
    try {
      req.user = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException({ message: 'No autenticado.' });
    }
    if (this.reflector.get<boolean>('soloAdmin', ctx.getHandler()) && req.user.role !== 'admin') {
      throw new ForbiddenException({ message: 'No tiene permisos para realizar esta acción.' });
    }
    return true;
  }
}
