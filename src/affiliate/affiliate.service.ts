import { Injectable } from '@nestjs/common';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { UpdateAffiliateDto } from './dto/update-affiliate.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Affiliate from './entities/affiliate.entity';

@Injectable()
export class AffiliateService {
  constructor(
    @InjectRepository(Affiliate)
    private affiliateRepository: Repository<Affiliate>
  ) { }
  create(createAffiliateDto: CreateAffiliateDto): Promise<Affiliate> {
    const affiliate = this.affiliateRepository.create(createAffiliateDto);
    return this.affiliateRepository.save(affiliate);
  }

  findAll() {
    return `This action returns all affiliate`;
  }

  findOne(id: number): Promise<Affiliate> {
    return this.affiliateRepository.findOne({where: {id}});

  }

  update(id: number, updateAffiliateDto: UpdateAffiliateDto) {
    return `This action updates a #${id} affiliate`;
  }

  remove(id: number) {
    return `This action removes a #${id} affiliate`;
  }

  async findAffiliateByUserId(userId: number): Promise<Affiliate | undefined> {
    try {
      const affiliate = await this.affiliateRepository.findOne({
        where: { user: { id: userId } },
        relations: ['user']
      });
      return affiliate || null;
    } catch (error) {
      console.error(`Error finding affiliate for user ${userId}:`, error);
      return null;
    }

  }
}
