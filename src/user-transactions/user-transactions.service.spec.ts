import { Test, TestingModule } from '@nestjs/testing';
import { UserTransactionsService } from './user-transactions.service';

describe('UserTransactionsService', () => {
  let service: UserTransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserTransactionsService],
    }).compile();

    service = module.get<UserTransactionsService>(UserTransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
