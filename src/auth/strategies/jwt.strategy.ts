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
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request | undefined) => readCookieToken(req, 'access_token'),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): { userId: string; email: string } {
    return { userId: payload.sub, email: payload.email };
  }
}
