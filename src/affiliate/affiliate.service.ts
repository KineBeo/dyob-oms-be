import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { UpdateAffiliateDto } from './dto/update-affiliate.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import AffiliateProfile from './entities/affiliate.entity';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';
import { UserRole } from '../enum/rank';
import { CreateAffiliateFullAttributesDto } from './dto/create-affiliate-full-attributes.dto';
@Injectable()
export class AffiliateService {
  constructor(
    @InjectRepository(AffiliateProfile)
    private affiliateRepository: Repository<AffiliateProfile>,
    private usersService: UsersService,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
  ) {}
  /**
   * * Generates a unique 6-character referral code
   */
  generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async create(createAffiliateDto: CreateAffiliateDto) {
    return 'This action adds a new affiliate';
  }

  async findAll() {
    return 'This action returns all affiliate';
  }

  async findOne(id: number) {
    return 'This action returns a #${id} affiliate';
  }

  async update(id: number, updateAffiliateDto: UpdateAffiliateDto) {
    return 'This action updates a #${id} affiliate';
  }

  async remove(id: number) {
    return 'This action removes a #${id} affiliate';
  }

  async findAffiliateByUserId(userId: number): Promise<AffiliateProfile> {
    try {
      const affiliate = await this.affiliateRepository.findOne({
        where: { user: { id: userId } },
        relations: ['user', 'orders'],
      });

      return affiliate;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Something went wrong from find affiliate by user ID service',
      );
    }
  }

   /**
   * TODO: Service for seed affiliates
   */
   async createAffiliateSeed(createAffiliateWithFullAttributes: CreateAffiliateFullAttributesDto): Promise<AffiliateProfile> {
    try {
      const { user_id, parent_affiliate_id } = createAffiliateWithFullAttributes;

      const user = await this.usersService.findOne(user_id);
      if (!user) {
        throw new NotFoundException(`User with ID ${user_id} not found from create affiliate seed service`);
      }

      const existingAffiliate = await this.affiliateRepository.findOne({
        where: { user: { id: user_id } },
      });

      if (existingAffiliate) {
        throw new ConflictException(`Affiliate for user ${user_id} already exists`);
      }

      // * handle parent affiliate if provided
      let parentAffiliate = null;
      if (parent_affiliate_id) {
        parentAffiliate = await this.affiliateRepository.findOne({
          where: { id: parent_affiliate_id },
        });

        if (!parentAffiliate) {
          throw new NotFoundException(`Parent affiliate with ID ${parent_affiliate_id} not found`);
        }
      }

      // * create new affiliate
      const affiliate = this.affiliateRepository.create({
        user: { id: user_id },
        parent: parentAffiliate,
        referral_code: this.generateReferralCode(),
        rank: UserRole.GUEST,
        direct_referrals_count: 0,
        ...createAffiliateWithFullAttributes,
      });

      return await this.affiliateRepository.save(affiliate);
    } catch (error) {
      throw new BadRequestException('Something went wrong from create affiliate seed service');
    }
  }
}
