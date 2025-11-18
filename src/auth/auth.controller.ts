import { Controller, Post, Body, Res, HttpStatus, Patch, UseGuards, Req } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { UserPayload } from './types/user-payload.interface';

@Controller('/api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    const token = await this.authService.login(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',   // prevents CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days

    })

    return res
      .status(HttpStatus.OK) // 👈 custom status code
      .json({
        message: 'Login successful',
        // data: token,
        user: {
          email: user.email,
          _id: user._id
        }
      });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @Req() req: Request,
    @Body() dto: ChangePasswordDto,
    @Res() res: Response,
    @CurrentUser() user: UserPayload,
  ) {

    const result = await this.authService.changePassword(user, dto);

    return res.status(HttpStatus.OK).json({
      message: result.message,
      user: {
        _id: user._id,
        email: user.email,
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-otp')
  async sendOtp(@CurrentUser() user: UserPayload){
    return this.authService.sendOtp(user);
  }

  // @UseGuards(JwtAuthGuard)
  // @Post('forgot-password')
  // async forgotPassword(@)
}
