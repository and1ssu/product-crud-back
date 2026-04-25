import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  email: string;
}

function readCookieToken(req: Request | undefined, cookieName: string): string | null {
  if (!req) {
    return null;
  }
  const cookies = req.cookies as unknown;
  if (typeof cookies !== 'object' || cookies === null) {
    return null;
  }
  const value = (cookies as Record<string, unknown>)[cookieName];
  return typeof value === 'string' ? value : null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request | undefined) => readCookieToken(req, 'refresh_token'),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(
    req: Request,
    payload: JwtPayload,
  ): { userId: string; email: string; refreshToken: string } {
    const refreshToken = readCookieToken(req, 'refresh_token') ?? '';
    return { userId: payload.sub, email: payload.email, refreshToken };
  }
}
