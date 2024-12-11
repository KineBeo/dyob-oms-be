import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommissionHistoryDto } from './dto/create-commission-history.dto';
import { UpdateCommissionHistoryDto } from './dto/update-commission-history.dto';
import { CommissionHistory } from './entities/commission-history.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UserStatusService } from 'src/user-status/user-status.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class CommissionHistoryService {
  constructor(
    @InjectRepository(CommissionHistory)
    private commissionHistoryRepository: Repository<CommissionHistory>,
    private userStatusService: UserStatusService,
  ) {}
  async create(createCommissionHistoryDto: CreateCommissionHistoryDto) {
    try {
      const userStatus = await this.userStatusService.findOne(createCommissionHistoryDto.userStatusId);
      const commissionHistory = this.commissionHistoryRepository.create({
        userStatus: userStatus,
        monthly_commission: createCommissionHistoryDto.monthlyCommission,
        group_commission: createCommissionHistoryDto.groupCommission,
        month: createCommissionHistoryDto.month,
        year: createCommissionHistoryDto.year,
      });
      return this.commissionHistoryRepository.save(commissionHistory);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll() {
    try {
      return await this.commissionHistoryRepository.find({
        relations: ['userStatus', 'userStatus.user'],
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @OnEvent('storeCommissionHistoryMonthly')
  async storeCommissionHistoryMonthly() {
    const allUserStatus = await this.userStatusService.findAll();
    allUserStatus.forEach(async (status) => {
      this.create({
        userStatusId: status.id,
        monthlyCommission: status.commission,
        groupCommission: status.group_commission,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        // createdAt: new Date(),
      })
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} commissionHistory`;
  }

  async findOneByUserStatusId(id: number) {
    try {
      const history = await this.commissionHistoryRepository.findOne({
        where: { userStatus: { id } },
        relations: ['userStatus'],
      });

      if (!history) {
        throw new NotFoundException(`Commission history with user status id ${id} not found`);
      }

      return history;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  update(id: number, updateCommissionHistoryDto: UpdateCommissionHistoryDto) {
    return `This action updates a #${id} commissionHistory`;
  }

  remove(id: number) {
    return `This action removes a #${id} commissionHistory`;
  }
}
