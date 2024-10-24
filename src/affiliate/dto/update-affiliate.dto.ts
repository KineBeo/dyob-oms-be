import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../enum/rank';

export class UpdateAffiliateDto {
    @IsOptional()
    @IsString()
    total_purchase?: string;

    @IsOptional()
    @IsString()
    personal_income?: string;

    @IsOptional()
    @IsString()
    commission?: string;

    @IsOptional()
    @IsString()
    group_sales?: string;

    @IsOptional()
    @IsNumber()
    direct_referrals_count?: number;

    @IsOptional()
    @IsString()
    direct_sales?: string;

    @IsOptional()
    @IsEnum(UserRole)
    rank?: UserRole;
}
