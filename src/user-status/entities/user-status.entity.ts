import { UserRole } from "../../enum/rank";
import User from "../../users/entities/user.entity";
import { PrimaryGeneratedColumn, OneToOne, JoinColumn, Column, CreateDateColumn, UpdateDateColumn, Entity } from "typeorm";

@Entity()
export class UserStatus {
    @PrimaryGeneratedColumn()
    id: number;
  
    @OneToOne(() => User, user => user.status)
    @JoinColumn({ name: 'user_id' })
    user: User;
  
    @Column({ default: '0' })
    total_purchase: string; 
  
    @Column({ default: 0 })
    total_orders: number;
  
    @Column({
      type: 'enum',
      enum: UserRole,
      default: UserRole.NVTN
    })
    user_rank: UserRole;
  
    @Column({ type: 'timestamp', nullable: true })
    last_rank_update: Date;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
}
