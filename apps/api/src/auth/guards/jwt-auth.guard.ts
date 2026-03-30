import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthUser } from '@shared-types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = this.extractToken(req);

    if (!token) {
      throw new UnauthorizedException('Missing auth token');
    }

    try {
      req.user = await this.jwtService.verifyAsync<AuthUser>(token, {
        secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      });
      return true;
    } catch {
      throw new UnauthorizedException('Invalid auth token');
    }
  }

  private extractToken(req: Request) {
    const bearer = req.headers.authorization;
    if (bearer?.startsWith('Bearer ')) {
      return bearer.slice(7);
    }

    return (req as Request & { cookies?: Record<string, string> }).cookies?.access_token;
  }
}
