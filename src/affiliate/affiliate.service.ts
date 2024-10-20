import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { UpdateAffiliateDto } from './dto/update-affiliate.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Affiliate from './entities/affiliate.entity';
import { UsersService } from 'src/users/users.service';
import User from 'src/users/entities/user.entity';

@Injectable()
export class AffiliateService {
  constructor(
    @InjectRepository(Affiliate)
    private affiliateRepository: Repository<Affiliate>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private usersService: UsersService,
  ) { }
  async create(createAffiliateDto: CreateAffiliateDto): Promise<Affiliate> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: createAffiliateDto.user_id },
        relations: ['affiliate'],
      })
      if (!user) {
        throw new NotFoundException(`User with ID ${createAffiliateDto.user_id} not found from create affiliate service`);
      }

      if (user.affiliate) {
        throw new ConflictException(`User with ID ${createAffiliateDto.user_id} already has an affiliate account`);
      }

      const affiliate = this.affiliateRepository.create({
        referral_code: createAffiliateDto.referral_code,
        user: { id: createAffiliateDto.user_id },
      })

      return await this.affiliateRepository.save(affiliate);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong from create affiliate service');
    }
  }

  async findAll(): Promise<Affiliate[]> {
    try {
      return await this.affiliateRepository.find();
    } catch (error) {
      throw new BadRequestException('Something went wrong from find all affiliates service');
    }
  }

  async findOne(id: number): Promise<Affiliate> {
    try {
      const affiliate = await this.affiliateRepository.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!affiliate) {
        throw new NotFoundException(`Affiliate with ID ${id} not found from find one affiliate service`);
      }

      return affiliate;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong from find one affiliate service');
    }
  }

  async update(id: number, updateAffiliateDto: UpdateAffiliateDto) {
    return `This action updates a #${id} affiliate`;
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      const affiliate = await this.affiliateRepository.findOne({
        where: { id },
      });

      if (!affiliate) {
        throw new NotFoundException(`Affiliate with ID ${id} not found from remove affiliate service`);
      }

      await this.affiliateRepository.delete(id);
      return { message: `Affiliate with ID ${id} has been deleted successfully` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong from remove affiliate service');
    }
  }

  async findAffiliateByUserId(userId: number): Promise<Affiliate | undefined> {
    try {
      const affiliate = await this.affiliateRepository.findOne({
        where: { user: { id: userId } },
        relations: ['user'],
      });
      return affiliate || null;
    } catch (error) {
      console.error(`Error finding affiliate for user ${userId}:`, error);
      return null;
    }
  }
}
