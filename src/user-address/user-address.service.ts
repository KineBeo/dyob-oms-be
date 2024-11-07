import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { UpdateUserAddressDto } from './dto/update-user-address.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAddress } from './entities/user-address.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserAddressService {
  constructor(
    @InjectRepository(UserAddress)
    private userAddressRepository: Repository<UserAddress>,
  ) {}
  async create(
    createUserAddressDto: CreateUserAddressDto,
  ): Promise<UserAddress> {
    try {
      const address = this.userAddressRepository.create({
        user: { id: createUserAddressDto.user_id },
        ...createUserAddressDto});
      if (createUserAddressDto.is_default) {
        this.userAddressRepository.update(
          {
            user: { id: createUserAddressDto.user_id },
            is_default: true,
          },
          { is_default: false },
        );
      }

      return this.userAddressRepository.save(address);
    } catch (error) {
      throw new BadRequestException(
        'Error creating user address from user address service',
        error.message,
      );
    }
  }

  async getUserAddresses(user_id: number): Promise<UserAddress[]> {
    return this.userAddressRepository.find({
      where: { user: { id: user_id } },
      order: {
        is_default: 'DESC',
        created_at: 'DESC',
      },
    });
  }

  async getDefaultAddress(user_id: number): Promise<UserAddress | null> {
    return this.userAddressRepository.findOne({
      where: { user: { id: user_id }, is_default: true },
    });
  }

  findAll() {
    return `This action returns all userAddress`;
  }

  async findOne(id: number): Promise<UserAddress> {
    try {
      return this.userAddressRepository.findOne({ where: { id } });
    } catch (error) {
      throw new BadRequestException(
        'Error finding user address from user address service',
        error.message,
      );
    }
  }

  update(id: number, updateUserAddressDto: UpdateUserAddressDto) {
    return `This action updates a #${id} userAddress`;
  }

  remove(id: number) {
    return `This action removes a #${id} userAddress`;
  }
}
