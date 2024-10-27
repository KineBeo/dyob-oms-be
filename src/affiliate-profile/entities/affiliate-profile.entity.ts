import Order from '../../orders/entities/order.entity';
import User from "../../users/entities/user.entity";
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export default class AffiliateProfile {
    @PrimaryGeneratedColumn()
    id: number;

    // ! checked
    @OneToOne(() => User, user => user.affiliateProfile)
    @JoinColumn({ name: 'user_id' })
    user: User;

    // ! checked 
    @Column({ unique: true })
    referral_code: string;

    // ! checked
    @Column({ default: '0' })
    direct_sales: string; // Sales made directly through affiliate's referral link (DSCN)

    // ! checked
    @Column({ default: '0' })
    group_sales: string; // Total sales of all direct referrals (DSN)

    // ! checked
    @Column({ type: 'text', default: '0' })
    direct_commission: string; // Total commission earned by affiliate (Hoa hồng trực tiếp)

    /** 
     * TODO: Đủ loại thưởng ở đây* 
     * 
     *  */ 

    // ! checked
    @Column({ default: 0 })
    direct_referrals_count: number; // Number of direct referrals 

    // ! checked
    @Column({ type: 'timestamp', nullable: true })
    last_rank_check: Date;

    // ! checked
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

    @ManyToOne(() => AffiliateProfile, { nullable: true })
    @JoinColumn({ name: 'parent_affiliate_id' })
    parent: AffiliateProfile;

    @OneToMany(() => AffiliateProfile, affiliate => affiliate.parent)
    children: AffiliateProfile[];
}
