import { NestFactory } from '@nestjs/core';
import { Faker, faker } from '@faker-js/faker';
import { AppModule } from '../../app.module';
import { UserRank } from '../../enum/rank';
import { OrderStatus } from '../../enum/order-status';
import { UsersService } from '../../users/users.service';
import { AffiliateProfileService } from '../../affiliate-profile/affiliate-profile.service';
import { OrdersService } from '../../orders/orders.service';
import User from 'src/users/entities/user.entity';
import AffiliateProfile from '../../affiliate-profile/entities/affiliate-profile.entity';
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const affiliateService = app.get(AffiliateProfileService);
  const ordersService = app.get(OrdersService);

  try {
    // Create users with different roles
    const users = await seedUsers(usersService, 20);
    console.log('✅ Users seeded');

    // Create affiliates with hierarchy
    const affiliates = await seedAffiliates(affiliateService, users);
    console.log('✅ Affiliates seeded');

    // Create orders
    await seedOrders(ordersService, users, affiliates);
    console.log('✅ Orders seeded');

    console.log('🌱 Seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

async function seedUsers(usersService: UsersService, count: number) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = await usersService.createUserSeed({
      email: faker.internet.email(),
      phone_number: faker.phone.number({ style: 'human' }),
      password_hash: 'StrongP@ssw0rd!',
      fullname: faker.person.fullName(),
      bank_name: faker.finance.accountName(),
      bank_account_number: faker.finance.accountNumber(),
    });
    users.push(user);
  }
  return users;
}

async function seedAffiliates(
  affiliateService: AffiliateProfileService,
  users: any[],
) {
  const affiliates = [];

  // Create root affiliates (no parent)
  for (let i = 0; i < 3; i++) {
    const affiliate = await affiliateService.createAffiliateSeed({
      user_id: users[i].id,
      rank: UserRank.GDKD,
      commission: faker.number.int({ min: 1000000, max: 5000000 }).toString(),
      direct_sales: faker.number
        .int({ min: 150000000, max: 300000000 })
        .toString(),
      group_sales: faker.number
        .int({ min: 450000000, max: 900000000 })
        .toString(),
      referral_code: faker.string.alphanumeric(10),
    });
    affiliates.push(affiliate);
  }

  // Create manager level affiliates
  for (let i = 3; i < 8; i++) {
    const affiliate = await affiliateService.createAffiliateSeed({
      user_id: users[i].id,
      parent_affiliate_id: affiliates[Math.floor((i - 3) / 2)].id,
      rank: UserRank.TPKD,
      commission: faker.number.int({ min: 500000, max: 2000000 }).toString(),
      direct_sales: faker.number
        .int({ min: 50000000, max: 100000000 })
        .toString(),
      group_sales: faker.number
        .int({ min: 150000000, max: 300000000 })
        .toString(),
        referral_code: faker.string.alphanumeric(10),
    });
    affiliates.push(affiliate);
  }

  // Create staff level affiliates
  for (let i = 8; i < users.length; i++) {
    const affiliate = await affiliateService.createAffiliateSeed({
      user_id: users[i].id,
      parent_affiliate_id: affiliates[Math.floor((i - 8) / 3) + 3].id,
      rank: UserRank.NVKD,
      commission: faker.number.int({ min: 100000, max: 1000000 }).toString(),
      direct_sales: faker.number
        .int({ min: 3000000, max: 30000000 })
        .toString(),
      group_sales: faker.number.int({ min: 3000000, max: 30000000 }).toString(),
      referral_code: faker.string.alphanumeric(10),
    });
    affiliates.push(affiliate);
  }

  return affiliates;
}

async function seedOrders(
  ordersService: OrdersService,
  users: User[],
  affiliates: AffiliateProfile[],
) {
  const orders = [];
  const statuses = Object.values(OrderStatus);

  // Create 50 random orders
  for (let i = 0; i < 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const affiliate = affiliates[Math.floor(Math.random() * affiliates.length)];

    const order = await ordersService.createOrderSeed(user.id, {
      user_id: user.id,
      affiliate_id: affiliate.id,
      total_amount: (faker.number.int({ min: 1, max: 100 }) * 100000).toString(),
      address: faker.location.streetAddress(),
      status: statuses[Math.floor(Math.random() * statuses.length)],
    });
    orders.push(order);
  }
  return orders;
}

bootstrap();
