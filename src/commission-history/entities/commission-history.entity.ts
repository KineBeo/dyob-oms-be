import { UserStatus } from 'src/user-status/entities/user-status.entity';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class CommissionHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserStatus, { nullable: false })
  @JoinColumn({ name: 'user_status_id' })
  @Index('idx_user_status')
  userStatus: UserStatus;

  @Column()
  monthly_commission: string; // 1 tháng

  @Column()
  bonus: string; // 1 tháng

  // @Column()
  // group_commission: string; // 3 tháng gần nhất

  @Column({ type: 'int', comment: 'Tháng ghi nhận (1-12)' })
  month: number;

  @Column({ type: 'int', comment: 'Năm ghi nhận' })
  year: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @BeforeInsert()
  updateCreatedAt() {
    this.createdAt = new Date();
  }
}
