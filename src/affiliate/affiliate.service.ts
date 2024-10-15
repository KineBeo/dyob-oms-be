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
  ) {}
  create(createAffiliateDto: CreateAffiliateDto) {
    return 'This action adds a new affiliate';
  }

  findAll() {
    return `This action returns all affiliate`;
  }

  findOne(id: number) {
    return `This action returns a #${id} affiliate`;
  }

  update(id: number, updateAffiliateDto: UpdateAffiliateDto) {
    return `This action updates a #${id} affiliate`;
  }

  remove(id: number) {
    return `This action removes a #${id} affiliate`;
  }

  async findAffiliateByUserId(userId: number): Promise<Affiliate | undefined> {
    return this.affiliateRepository.findOne({ where: { user: { id: userId } } });
  }
}
