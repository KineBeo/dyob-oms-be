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
import { PaginationDto } from './dto/pagination.dto';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { phone_number, password_hash, ...rest } = createUserDto;

    // Check for existing user with the same phone number
    const existingUser = await this.userRepository.findOne({
      where: { phone_number },
    });

    if (existingUser) {
      throw new ConflictException('Phone number is already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password_hash, 10);

    // Create new user
    const newUser = this.userRepository.create({
      ...rest,
      phone_number,
      password_hash: hashedPassword,
    });

    // Save the user
    return this.userRepository.save(newUser);
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

  async findPageOfUser(paginationDto: PaginationDto): Promise<{
    data: Omit<User, 'password_hash'>[];
    totalPages: number;
    currentPage: number;
  }> {
    const { page = 1, pageSize = 100, search } = paginationDto;

    // Create query builder
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Apply search if provided
    if (search) {
      queryBuilder.andWhere(
        'user.fullname LIKE :search OR user.phone_number LIKE :search',
        {
          search: `%${search}%`,
        },
      );
    }

    // Calculate total count for pagination
    const totalCount = await queryBuilder.getCount();
    const totalPages = Math.ceil(totalCount / pageSize);

    // Apply pagination
    const users = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // Map users to remove sensitive information
    const mappedUsers = users.map(
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

    return {
      data: mappedUsers,
      totalPages,
      currentPage: page,
    };
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

  // async findByEmail(
  //   email: string,
  // ): Promise<Omit<User, 'password_hash'> | undefined> {
  //   try {
  //     const user = await this.userRepository.findOne({
  //       where: { email },
  //     });
  //     if (!user) {
  //       throw new ConflictException(
  //         'User not found from find by email service',
  //       );
  //     }
  //     const {
  //       password_hash,
  //       updateCreatedAt,
  //       updateUpdatedAt,
  //       ...userWithoutPassword
  //     } = user;
  //     return { ...userWithoutPassword, updateCreatedAt, updateUpdatedAt };
  //   } catch (error) {
  //     throw new BadRequestException(
  //       'Something went wrong from find by email service',
  //     );
  //   }
  // }

  // async findByEmailWithPassword(email: string): Promise<User | undefined> {
  //   try {
  //     const user = await this.userRepository.findOne({
  //       where: { email },
  //     });
  //     if (!user) {
  //       throw new ConflictException(
  //         'User not found from find by email with password service',
  //       );
  //     }
  //     return user;
  //   } catch (error) {
  //     throw new BadRequestException(
  //       'Something went wrong from find by email with password service',
  //     );
  //   }
  // }
  async findByPhoneNumberWithPassword(
    phone_number: string,
  ): Promise<User | undefined> {
    try {
      const user = await this.userRepository.findOne({
        where: { phone_number },
      });
      if (!user) {
        throw new ConflictException(
          'User not found from find by phone number with password service',
        );
      }
      return user;
    } catch (error) {
      throw new BadRequestException(
        'Something went wrong from find by phone number with password service',
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
  // async createUserSeed(
  //   createUserWithFullAttributesDto: CreateUserFullAttributesDto,
  // ): Promise<User> {
  //   const { email, phone_number, password_hash, ...rest } =
  //     createUserWithFullAttributesDto;

  //   const existingUser = await this.userRepository.findOne({
  //     where: [{ email }, { phone_number }],
  //   });
  //   if (existingUser) {
  //     throw new ConflictException(
  //       'User already exists with that email or phone number',
  //     );
  //   }

  //   const hashedPassword = await bcrypt.hash(password_hash, 10);
  //   const newUser = this.userRepository.create({
  //     ...rest,
  //     email,
  //     phone_number,
  //     password_hash: hashedPassword,
  //   });

  //   return this.userRepository.save(newUser);
  // }
}
