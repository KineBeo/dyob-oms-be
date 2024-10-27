import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNumber, IsString, Min } from "class-validator";
import { UserRole } from "../../enum/rank";

export class CreateUserStatusDto {
    @ApiProperty({
        description: 'User ID',
        example: 1
      })
      @IsNumber()
      @Min(1)
      user_id: number;
    
      @ApiProperty({
        description: 'Total purchase amount',
        example: '0'
      })
      @IsString()
      total_purchase: string;
    
      @ApiProperty({
        description: 'Total number of orders',
        example: '0'
      })
      @IsString()
      total_orders: number;
    
      @ApiProperty({
        description: 'Is user an affiliate',
        example: false
      })
      @IsBoolean()
      isAffiliate: boolean;
    
      @ApiProperty({
        description: 'User rank',
        enum: UserRole,
        example: UserRole.NVTN
      })
      @IsEnum(UserRole)
      user_rank: UserRole;
}
