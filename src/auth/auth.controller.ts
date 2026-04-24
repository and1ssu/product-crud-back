import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; refreshToken?: string };
}

const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<{ id: string; name: string; email: string }> {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login and receive auth cookies' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const tokens = await this.authService.login(dto);
    this.setCookies(res, tokens);
    return { message: 'Login successful' };
  }

  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthenticatedRequest): Promise<{ id: string; name: string; email: string }> {
    return this.authService.me(req.user.userId);
  }

  @ApiCookieAuth('refresh_token')
  @ApiOperation({ summary: 'Refresh access token using refresh cookie' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 403, description: 'Invalid or expired refresh token' })
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const tokens = await this.authService.refresh(
      req.user.userId,
      req.user.refreshToken!,
    );
    this.setCookies(res, tokens);
    return { message: 'Tokens refreshed' };
  }

  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 400, description: 'Validation error or wrong current password' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ): Promise<{ id: string; name: string; email: string }> {
    return this.authService.updateProfile(req.user.userId, dto);
  }

  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Logout and clear auth cookies' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logout(req.user.userId);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }

  private setCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ): void {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: ACCESS_COOKIE_MAX_AGE,
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: REFRESH_COOKIE_MAX_AGE,
      path: '/auth/refresh',
    });
  }
}
