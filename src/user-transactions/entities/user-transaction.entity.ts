import { TransactionType } from 'src/enum/transactionType';
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

  @Column()
  note: string;

  @ManyToOne(() => User, (user) => user.transactions)
  user: User;

  @Column()
  createdAt: Date;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date();
  }
}
