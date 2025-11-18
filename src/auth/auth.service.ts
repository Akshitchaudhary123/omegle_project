import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { USER_NOT_FOUND, INVALID_CREDENTIALS } from './../common/constants';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RedisService } from 'src/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { UserDocument } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly config: ConfigService
  ) { }

  //  Validate user during login
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException(USER_NOT_FOUND);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException(INVALID_CREDENTIALS);

    // remove password from returned user
    const userDoc = user as UserDocument;
    const { password: _, ...result } = userDoc.toObject ? userDoc.toObject() : user;
    return result;
  }

  // ✅ Generate JWT token
  async login(user: any) {
    const payload = { email: user.email, _id: user._id };
    return this.jwtService.sign(payload);

  }

  // ✅ Register user (uses DTO)
  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.usersService.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const userDoc = newUser as UserDocument;
    const { password, ...userWithoutPassword } = userDoc.toObject ? userDoc.toObject() : userDoc;
    return userWithoutPassword;
  }

  async changePassword(user: any, dto: ChangePasswordDto) {
    const { oldPassword, newPassword } = dto;

    const foundUser = await this.usersService.findById(user._id);
    if (!foundUser) throw new UnauthorizedException('User not found');

    // check old password
    const isMatch = await bcrypt.compare(oldPassword, foundUser.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid old password');
    }

    // prevent same new password
    const isSame = await bcrypt.compare(newPassword, foundUser.password);
    if (isSame) {
      throw new ConflictException('New password cannot be same as old password');
    }

    // hash and update
    foundUser.password = await bcrypt.hash(newPassword, 10);
    await foundUser.save();

    return { message: 'Password changed successfully' };
  }

  async sendOtp(user: any) {

    const userId = user._id;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiryMinutes = parseInt(this.config.get<string>('OTP_EXPIRY') ?? '5');
    await this.redisService.setWithExpiry(
      `${userId}userOtp`,
      otp,
      otpExpiryMinutes * 60 // convert minutes → seconds
    );

    

    // return { "otp sent successfully"}
  }

}

