import { Module } from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { AffiliateController } from './affiliate.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import Affiliate from './entities/affiliate.entity';
import { UsersModule } from 'src/users/users.module';
import User from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Affiliate, User]), UsersModule],
  controllers: [AffiliateController],
  providers: [AffiliateService],
  exports: [AffiliateService],
})
export class AffiliateModule {}
