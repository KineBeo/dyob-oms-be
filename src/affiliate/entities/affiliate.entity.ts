
import { UserRole } from '../../enum/rank';
import Order from '../../orders/entities/order.entity';
import User from "../../users/entities/user.entity";
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export default class Affiliate {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    referral_code: string;

    // checked
    @OneToOne(() => User, user => user.affiliate)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.GUEST
    })
    rank: UserRole;

    @Column({ default: '0' })
    total_purchase: string; // total amount purchased by affiliate

    @Column({ default: '0' })
    direct_sales: string; // Sales made directly through affiliate's referral link

    @Column({ default: '0' })
    group_sales: string; // Total sales of all direct referrals

    @Column({ type: 'text', default: '0' })
    commission: string; // Total commission earned by affiliate

    @Column({ default: '0' }) 
    personal_income: string; // Personal income from direct sales

    @Column({ default: 0 })
    direct_referrals_count: number;

    @Column({ type: 'timestamp', nullable: true })
    last_rank_check: Date;

    @Column({ type: 'timestamp', nullable: true })
    rank_achievement_date: Date; // When current rank was achieved

    @Column({ type: 'timestamp' })
    createdAt: Date;

    @BeforeInsert()
    updateCreatedAt() {
        this.createdAt = new Date(new Date().getTime());
        this.last_rank_check = new Date(new Date().getTime());
    }

    @OneToMany(() => Order, order => order.affiliate)
    orders: Order[];

    @ManyToOne(() => Affiliate, { nullable: true })
    @JoinColumn({ name: 'parent_affiliate_id' })
    parent: Affiliate;

    @OneToMany(() => Affiliate, affiliate => affiliate.parent)
    children: Affiliate[];
}
