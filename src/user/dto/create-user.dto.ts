import {
    IsString,
    IsEmail,
    IsOptional,
    IsInt,
    Min,
    MaxLength,
    MinLength,
    IsNotEmpty,
    IsEnum
} from 'class-validator';

export enum Gender {
    Male = 'male',
    Female = 'female',
    Other = 'other',
}

export class CreateUserDto {
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    @MaxLength(50, { message: 'Name must not exceed 50 characters' })
    readonly name: string;

    @IsEmail({}, { message: 'Email must be valid' })
    @IsNotEmpty({ message: 'Email is required' })
    readonly email: string;

    @IsInt({ message: 'Age must be an integer' })
    @Min(18, { message: 'Age must be at least 18' })
    readonly age: number;

    @IsEnum(Gender, { message: 'Gender must be male, female, or other' })
    @IsNotEmpty({ message: 'Gender is required' })
    readonly gender: Gender;

    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @MaxLength(20, { message: 'Password must not exceed 20 characters' })
    readonly password: string;
}
