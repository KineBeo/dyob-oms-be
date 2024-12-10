import { PartialType } from '@nestjs/swagger';
import { CreateCommissionHistoryDto } from './create-commission-history.dto';

export class UpdateCommissionHistoryDto extends PartialType(CreateCommissionHistoryDto) {}
