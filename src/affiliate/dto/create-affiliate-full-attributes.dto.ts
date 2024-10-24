import { UserRole } from "src/enum/rank";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAffiliateFullAttributesDto {
    @IsString()
    @IsNotEmpty()
    referral_code: string;

    @IsNumber()
    @IsNotEmpty()
    user_id: number;

    @IsEnum(UserRole)
    @IsOptional()
    rank?: UserRole;

    @IsString()
    @IsOptional()
    total_purchase?: string;

    @IsString()
    @IsOptional()
    direct_sales?: string;

    @IsString()
    @IsOptional()
    group_sales?: string;

    @IsString()
    @IsOptional()
    commission?: string;

    @IsString()
    @IsOptional()
    personal_income?: string;

    @IsNumber()
    @IsOptional()
    direct_referrals_count?: number;

    @IsOptional()
    last_rank_check?: Date;

    @IsOptional()
    rank_achievement_date?: Date;

    @IsOptional()
    createdAt?: Date;

    @IsUUID()
    @IsOptional()
    parent_affiliate_id?: number;
}