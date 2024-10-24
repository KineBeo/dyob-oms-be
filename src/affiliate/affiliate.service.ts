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
import Affiliate from './entities/affiliate.entity';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';
import { UserRole } from '../enum/rank';
import { CreateAffiliateFullAttributesDto } from './dto/create-affiliate-full-attributes.dto';
@Injectable()
export class AffiliateService {
  constructor(
    @InjectRepository(Affiliate)
    private affiliateRepository: Repository<Affiliate>,
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

  /**
   * * Creates a new affiliate
   * * Initial rank is GUEST (Khách lẻ)
   * ! Requires user ID and optional parent affiliate ID
   * * Status: Checked
   */
  async create(createAffiliateDto: CreateAffiliateDto): Promise<Affiliate> {
    try {
      const { user_id, parent_affiliate_id } = createAffiliateDto;

      const user = await this.usersService.findOne(user_id);
      if (!user) {
        throw new NotFoundException(
          `User with ID ${user_id} not found from create affiliate service`,
        );
      }

      const existingAffiliate = await this.affiliateRepository.findOne({
        where: { user: { id: user_id } },
      });

      if (existingAffiliate) {
        throw new ConflictException(
          `Affiliate for user ${user_id} already exists`,
        );
      }

      // * handle parent affiliate if provided
      let parentAffiliate = null;
      if (parent_affiliate_id) {
        parentAffiliate = await this.affiliateRepository.findOne({
          where: { id: parent_affiliate_id },
        });

        if (!parentAffiliate) {
          throw new NotFoundException(
            `Parent affiliate with ID ${parent_affiliate_id} not found`,
          );
        }
      }

      // * create new affiliate
      const affiliate = this.affiliateRepository.create({
        user: { id: user_id },
        parent: parentAffiliate,
        referral_code: this.generateReferralCode(),
        rank: UserRole.GUEST,
        direct_referrals_count: 0,
        ...createAffiliateDto,
      });

      return await this.affiliateRepository.save(affiliate);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Something went wrong from create affiliate service',
      );
    }
  }
  // ! **************Standard CRUD operations**************
  async findAll(): Promise<Affiliate[]> {
    try {
      return await this.affiliateRepository.find({
        relations: ['user', 'orders', 'parent', 'children'],
      });
    } catch (error) {
      throw new BadRequestException(
        'Something went wrong from find all affiliates service',
      );
    }
  }

  async findOne(id: number): Promise<Affiliate> {
    try {
      const affiliate = await this.affiliateRepository.findOne({
        where: { id },
        relations: ['user', 'orders', 'parent', 'children'],
      });

      if (!affiliate) {
        throw new NotFoundException(
          `Affiliate with ID ${id} not found from find one affiliate service`,
        );
      }

      return affiliate;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Something went wrong from find one affiliate service',
      );
    }
  }

  async update(id: number, updateAffiliateDto: UpdateAffiliateDto) {
    try {
      const affiliate = await this.findOne(id);
      if (!affiliate) {
        throw new NotFoundException(
          `Affiliate with ID ${id} not found from update affiliate service`,
        );
      }
      const updatedAffiliate = Object.assign(affiliate, updateAffiliateDto);
      await this.affiliateRepository.save(updatedAffiliate);
      return updatedAffiliate;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Something went wrong from update affiliate service',
      );
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      const affiliate = await this.affiliateRepository.findOne({
        where: { id },
      });

      if (!affiliate) {
        throw new NotFoundException(
          `Affiliate with ID ${id} not found from remove affiliate service`,
        );
      }

      await this.affiliateRepository.delete(id);
      return {
        message: `Affiliate with ID ${id} has been deleted successfully`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Something went wrong from remove affiliate service',
      );
    }
  }

  async findAffiliateByUserId(userId: number): Promise<Affiliate> {
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

  async findAffiliateByReferralCode(referralCode: string): Promise<Affiliate> {
    try {
      const affiliate = await this.affiliateRepository.findOne({
        where: { referral_code: referralCode },
        relations: ['user', 'orders', 'parent', 'children'],
      });

      if (!affiliate) {
        throw new NotFoundException(
          `Affiliate with referral code ${referralCode} not found`,
        );
      }

      return affiliate;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Something went wrong from find affiliate by referral code service',
      );
    }
  }

  /**
   * * Calculates direct commission (20%) for affiliate from order
   * * Based on policy: NVKD gets 20% commission from direct referrals
   * * Commission is 20% of total order amount
   * * Commission is calculated only if affiliate exists
   * * Status: Checked
   */
  async calculateDirectCommission(orderId: number): Promise<string> {
    try {
      const order = await this.ordersService.findOne(orderId);
      if (!order.affiliate) {
        return '0';
      }

      let commission = 0;
      commission += parseFloat(order.total_amount) * 0.2;

      return commission.toString();
    } catch (error) {
      throw new BadRequestException(
        'Something went wrong from calculate commission service',
      );
    }
  }

  /**
   * * Calculates management bonus (5%) for TPKD and GDKD
   * * Based on policy: 5% bonus on group sales for qualifying managers
   * * Bonus is 5% of total group sales
   * * Bonus is calculated only if affiliate is a manager
   * * Status: Checked
   */
  async calculateManagementBonus(affiliateId: number): Promise<string> {
    try {
      const affiliate = await this.findOne(affiliateId);
      if (
        ![UserRole.SALES_MANAGER, UserRole.SALES_DIRECTOR].includes(
          affiliate.rank,
        )
      ) {
        return '0';
      }

      // TODO: 5% management bonus as per policy
      const bonus = parseFloat(affiliate.group_sales) * 0.05;
      return bonus.toString();
    } catch (error) {
      throw new BadRequestException(
        'Something went wrong from calculate management bonus service',
      );
    }
  }

  /**
   * * Calculates peer/promotion bonus (0.5%) for 12 months
   * * Based on policy: 0.5% monthly bonus for direct referrals reaching same or higher rank
   */
  async calculatePeerBonus(
    affiliateId: number,
    referredId: number,
  ): Promise<string> {
    try {
      const affiliate = await this.findOne(affiliateId);
      const referred = await this.findOne(referredId);

      // ! be careful this shit
      // TODO: set the rank become number like this: Example: GUEST = 0
      if (referred.rank >= affiliate.rank) {
        // 0.5% peer bonus as per policy
        const bonus = parseFloat(referred.group_sales) * 0.005;
        return bonus.toString();
      }
      return '0';
    } catch (error) {
      throw new BadRequestException('Failed to calculate peer bonus');
    }
  }

  /**
   * *Checks and updates affiliate rank based on performance
   * TODO: Implements rank conditions from policy:
   * ! - NVKD: 3M purchase in 30 days
   * ! - TPKD: 5 direct NVKD, 50M group sales in 60 days
   * ! - GDKD: 3 TPKD, 5 direct NVKD with 3M/month, 150M group sales in 60 days
   */
  async checkAndUpdateRank(affiliateId: number): Promise<{ message: string }> {
    try {
      const affiliate = await this.findOne(affiliateId);
      const now = new Date();

      // TODO: Time windows for rank checks
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // TODO: Get all direct referrals with their performance
      const directReferrals = await this.affiliateRepository.find({
        where: { parent: { id: affiliate.id } },
        relations: ['orders'],
      });

      const totalPurchase = parseFloat(affiliate.total_purchase);
      const groupSales = parseFloat(affiliate.group_sales);

      // ! Active NVKD: 3,000,000 VND personal sales in 30 days
      const activeNVKD = directReferrals.filter(
        (ref) => parseFloat(ref.direct_sales) >= 3000000,
      );

      // TODO: Check for NVKD rank
      if (totalPurchase >= 3000000 && affiliate.createdAt <= thirtyDaysAgo) {
        affiliate.rank = UserRole.SALES_STAFF;
      }

      // TODO: Check for TPKD rank
      if (
        affiliate.rank === UserRole.SALES_STAFF &&
        activeNVKD.length >= 5 &&
        groupSales >= 50000000 &&
        affiliate.createdAt <= sixtyDaysAgo
      ) {
        affiliate.rank = UserRole.SALES_MANAGER;
      }

      // TODO: Check for GDKD rank
      if (affiliate.rank === UserRole.SALES_MANAGER) {
        const directTPKD = activeNVKD.filter(
          (ref) =>
            ref.rank === UserRole.SALES_MANAGER &&
            parseFloat(ref.group_sales) >= 50000000,
        );

        if (
          directTPKD.length >= 3 &&
          activeNVKD.length >= 5 &&
          groupSales >= 150000000 &&
          affiliate.createdAt <= sixtyDaysAgo
        ) {
          affiliate.rank = UserRole.SALES_DIRECTOR;
        }

        // TODO: Check rank maintenance conditions

        affiliate.rank_achievement_date = now;
        await this.affiliateRepository.save(affiliate);
        return { message: 'Rank updated successfully' };
      }
    } catch (error) {
      throw new BadRequestException(
        'Something went wrong from check and update rank service',
      );
    }
  }
   /**
   * * Checks rank maintenance conditions
   * * Based on policy:
   * ! TPKD: 150M group sales OR 3 new NVKD with 150M total sales (3 month check)
   * ! GDKD: 450M group sales OR 2 new TPKD with 450M total sales (3 month check)
   */
  private async checkRankMaintenance(affiliate: Affiliate): Promise<{message: string}> {
    try {
      const threeMonthsAgo = new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000);
      if (affiliate.rank === UserRole.SALES_MANAGER) {
        const maintainsSales = parseFloat(affiliate.group_sales) >= 150000000;
        const newNVKD = await this.getNewActiveReferrals(affiliate.id, threeMonthsAgo, UserRole.SALES_STAFF);
        const maintainsRecruitment = newNVKD.length >= 3 && 
          this.calculateTotalGroupSales(newNVKD) >= 150000000;
  
        if (!maintainsSales && !maintainsRecruitment) {
          affiliate.rank = UserRole.SALES_STAFF;
        }
      }
      if (affiliate.rank === UserRole.SALES_DIRECTOR) {
        const maintainsSales = parseFloat(affiliate.group_sales) >= 450000000;
        const newTPKD = await this.getNewActiveReferrals(affiliate.id, threeMonthsAgo, UserRole.SALES_MANAGER);
        const maintainsRecruitment = newTPKD.length >= 2 && 
          this.calculateTotalGroupSales(newTPKD) >= 450000000;
  
        if (!maintainsSales && !maintainsRecruitment) {
          affiliate.rank = UserRole.SALES_MANAGER;
        }
      }

      return { message: 'Rank maintenance checked successfully' };
    } catch (error) {
      throw new BadRequestException('something went wrong from check rank maintenance service');
    }
  } 

  /**
   * Helper method to get new active referrals within time period
   */
  private async getNewActiveReferrals(
    affiliateId: number,
    since: Date,
    rank: UserRole
  ): Promise<Affiliate[]> {
    return this.affiliateRepository.find({
      where: {
        parent: { id: affiliateId },
        rank,
        createdAt: MoreThan(since)
      }
    });
  }

  /**
   * Helper method to calculate total group sales for array of affiliates
   */
  private calculateTotalGroupSales(affiliates: Affiliate[]): number {
    return affiliates.reduce((sum, aff) => sum + parseFloat(aff.group_sales), 0);
  }

  /**
   * TODO: Service for seed affiliates
   */
  async createAffiliateSeed(createAffiliateWithFullAttributes: CreateAffiliateFullAttributesDto): Promise<Affiliate> {
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
