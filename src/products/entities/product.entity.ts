import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import ProductCategory from "src/product-category/entities/product-category.entity";
import OrderProduct from "src/order_product/entities/order_product.entity";
@Entity()
export default class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'text', nullable: false, unique: true})
    name: string;

    @Column({type: 'text', nullable: true})
    description: string;

    @Column({ type: 'text', default: '0', nullable: false })
    price: string;

    @Column({ type: 'integer', default: 0, nullable: false })
    stock: number;

    @ManyToOne(() => ProductCategory, category => category.products)
    @JoinColumn({ name: 'category_id' })
    category: ProductCategory;

    @Column({ type: 'text', nullable: true })
    type: string;

    @Column({ type: 'jsonb', nullable: true })
    attributes: object;

    @Column({ type: 'timestamp' })
    public createdAt: Date;

    @Column({ type: 'timestamp' })
    public updatedAt: Date;

    @BeforeInsert()
    updateCreatedAt() {
        this.createdAt = new Date(new Date().getTime());
        this.updatedAt = new Date(new Date().getTime());
    }

    @BeforeUpdate()
    updateUpdatedAt() {
        this.updatedAt = new Date(new Date().getTime());
    }

    @OneToMany(() => OrderProduct, orderProduct => orderProduct.product)
    orderProduct: OrderProduct[];
}
