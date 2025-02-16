import { TransactionType } from 'src/enum/transactionType';
import { UserStatus } from 'src/user-status/entities/user-status.entity';
import User from 'src/users/entities/user.entity';
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
