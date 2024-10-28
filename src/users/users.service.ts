import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import User from './entities/user.entity';
import { CreateUserFullAttributesDto } from './dto/create-user-full-attributes.dto';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { email, phone_number, password_hash, ...rest } = createUserDto;

      // Check for existing user with the same email or phone number
      const existingUser = await queryRunner.manager
        .createQueryBuilder(User, 'user')
        .where('LOWER(user.email) = LOWER(:email)', { email })
        .orWhere('user.phone_number = :phone_number', { phone_number })
        .getOne();

      if (existingUser) {
        if (existingUser.email.toLowerCase() === email.toLowerCase()) {
          throw new ConflictException('Email address is already in use');
        }
        if (existingUser.phone_number === phone_number) {
          throw new ConflictException('Phone number is already in use');
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password_hash, 10);

      // Create new user
      const newUser = queryRunner.manager.create(User, {
        ...rest,
        email: email, // Normalize email to lowercase
        phone_number,
        password_hash: hashedPassword,
      });

      // Save the user within the transaction
      const savedUser = await queryRunner.manager.save(newUser);
      
      // Commit transaction
      await queryRunner.commitTransaction();
      
      return savedUser;

    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();

      if (error instanceof ConflictException) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        const err = error as any;
        if (err.code === '23505') { // Postgres unique violation
          if (err.detail?.includes('email')) {
            throw new ConflictException('Email address is already in use');
          }
          if (err.detail?.includes('phone_number')) {
            throw new ConflictException('Phone number is already in use');
          }
        }
      }

      throw new BadRequestException(
        'Failed to create user: ' + (error.message || 'Unknown error')
      );

    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Omit<User, 'password_hash'>[]> {
    const users = await this.userRepository.find();
    return users.map(
      ({
        password_hash,
        updateCreatedAt,
        updateUpdatedAt,
        ...userWithoutPassword
      }) => ({
        ...userWithoutPassword,
        updateCreatedAt,
        updateUpdatedAt,
      }),
    );
  }

  async findOne(id: number): Promise<Omit<User, 'password_hash'>> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException(
          'User not found from find one user by id service',
        );
      }
      const {
        password_hash,
        updateCreatedAt,
        updateUpdatedAt,
        ...userWithoutPassword
      } = user;
      return { ...userWithoutPassword, updateCreatedAt, updateUpdatedAt };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Something went wrong from find one user by id service',
      );
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    const { password_hash, ...rest } = updateUserDto;
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
    } catch (error) {
      console.log(error);
      throw new ConflictException(
        `User with ${id} not found from remove user by id service`,
      );
    }
  }

  async findByEmail(
    email: string,
  ): Promise<Omit<User, 'password_hash'> | undefined> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
      });
      if (!user) {
        throw new ConflictException(
          'User not found from find by email service',
        );
      }
      const {
        password_hash,
        updateCreatedAt,
        updateUpdatedAt,
        ...userWithoutPassword
      } = user;
      return { ...userWithoutPassword, updateCreatedAt, updateUpdatedAt };
    } catch (error) {
      throw new BadRequestException(
        'Something went wrong from find by email service',
      );
    }
  }

  async findByEmailWithPassword(email: string): Promise<User | undefined> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
      });
      if (!user) {
        throw new ConflictException(
          'User not found from find by email with password service',
        );
      }
      return user;
    } catch (error) {
      throw new BadRequestException(
        'Something went wrong from find by email with password service',
      );
    }
  }

  async findByPhoneNumber(
    phone_number: string,
  ): Promise<Omit<User, 'password_hash'> | undefined> {
    try {
      const user = await this.userRepository.findOne({
        where: { phone_number },
      });
      if (!user) {
        throw new ConflictException(
          'User not found from find by phone number service',
        );
      }
      const {
        password_hash,
        updateCreatedAt,
        updateUpdatedAt,
        ...userWithoutPassword
      } = user;
      return { ...userWithoutPassword, updateCreatedAt, updateUpdatedAt };
    } catch (error) {
      throw new BadRequestException(
        'Something went wrong from find by phone number service',
      );
    }
  }

  // TODO: service for seed users
  async createUserSeed(
    createUserWithFullAttributesDto: CreateUserFullAttributesDto,
  ): Promise<User> {
    const { email, phone_number, password_hash, ...rest } =
      createUserWithFullAttributesDto;

    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { phone_number }],
    });
    if (existingUser) {
      throw new ConflictException(
        'User already exists with that email or phone number',
      );
    }

    const hashedPassword = await bcrypt.hash(password_hash, 10);
    const newUser = this.userRepository.create({
      ...rest,
      email,
      phone_number,
      password_hash: hashedPassword,
    });

    return this.userRepository.save(newUser);
  }
}
