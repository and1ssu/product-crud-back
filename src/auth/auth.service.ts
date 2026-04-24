import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppException } from '../common/exceptions/app.exception';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ id: string; name: string; email: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new AppException('Email already registered', HttpStatus.CONFLICT);
    }

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, password: hashed },
    });

    return { id: user.id, name: user.name, email: user.email };
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new AppException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new AppException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    return this.generateTokens(user.id, user.email);
  }

  async refresh(userId: string, rawRefreshToken: string): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.refreshToken) {
      throw new AppException('Access denied', HttpStatus.FORBIDDEN);
    }

    const matches = await bcrypt.compare(rawRefreshToken, user.refreshToken);
    if (!matches) {
      throw new AppException('Access denied', HttpStatus.FORBIDDEN);
    }

    return this.generateTokens(user.id, user.email);
  }

  async me(userId: string): Promise<{ id: string; name: string; email: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    return user;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<{ id: string; name: string; email: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new AppException('Senha atual é obrigatória para alterar a senha', HttpStatus.BAD_REQUEST);
      }
      const valid = await bcrypt.compare(dto.currentPassword, user.password);
      if (!valid) {
        throw new AppException('Senha atual incorreta', HttpStatus.BAD_REQUEST);
      }
    }

    if (dto.email && dto.email !== user.email) {
      const taken = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (taken) {
        throw new AppException('Email já cadastrado', HttpStatus.CONFLICT);
      }
    }

    const data: { name?: string; email?: string; password?: string } = {};
    if (dto.name) data.name = dto.name;
    if (dto.email) data.email = dto.email;
    if (dto.newPassword) data.password = await bcrypt.hash(dto.newPassword, 12);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true },
    });

    return updated;
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  private async generateTokens(userId: string, email: string): Promise<TokenPair> {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d') as any,
      }),
    ]);

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefresh },
    });

    return { accessToken, refreshToken };
  }
}
