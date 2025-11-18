import { Body, Controller, Post, Get } from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ Create new user
  @Post('create')
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }



  //  Optional: Get all users (for testing)
//   @Get()
//   async findAll() {
//     return this.usersService.findAll();
//   }
}
