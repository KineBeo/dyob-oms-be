import { TransactionType } from '../../enum/transactionType';
import { UserStatus } from '../../user-status/entities/user-status.entity';
import {
  BeforeInsert,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class UserTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  amount: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => UserStatus, (userStatus) => userStatus.userTransactions)
  userStatus: UserStatus;

  @Column()
  createdAt: Date;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date();
  }
}
