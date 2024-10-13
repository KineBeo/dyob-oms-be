import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import User from './entities/user.entity';
import { MESSAGES } from '@nestjs/core/constants';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) { }

  // checked
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, phone_number, password_hash, ...rest } = createUserDto;

    const existingUser = await this.userRepository.findOne(
      { where: [{ email }, { phone_number }] }
    );
    if (existingUser) {
      throw new ConflictException('User already exists with that email or phone number');
    }

    const hashedPassword = await bcrypt.hash(password_hash, 10);
    const newUser = this.userRepository.create({
      ...rest,
      email,
      phone_number,
      password_hash: hashedPassword
    });

    return this.userRepository.save(newUser);
  }

  async findAll(): Promise<Omit<User, 'password_hash'>[]> {
    const users = await this.userRepository.find();
    return users.map(({ password_hash, updateCreatedAt, updateUpdatedAt, ...userWithoutPassword }) => ({
      ...userWithoutPassword,
      updateCreatedAt,
      updateUpdatedAt
    }));
  }

  async findOne(id: number): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new ConflictException('User not found');
      }
      return user;
    }
    catch (error) {
      throw new ConflictException('User not found');
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne(
      { where: { id } }
    );
    const {password_hash, ...rest} = updateUserDto;
    if (password_hash) {
      user.password_hash = await bcrypt.hash(password_hash, 10);
    }

    Object.assign(user, rest);
    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      const res = await this.userRepository.delete(id);
      if (res.affected === 0) {
        throw new ConflictException(`User with ${id} not found`);
      } else {
        const message = `User with id ${id} has been successfully deleted`;
        return { message };
      }
    }
    catch (error) {
      console.log(error);
      throw new ConflictException(`User with ${id} not found`);
    }
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByPhoneNumber(phone_number: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { phone_number } });
  }
}
