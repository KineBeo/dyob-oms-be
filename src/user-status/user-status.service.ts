import { Injectable } from '@nestjs/common';
import { CreateUserStatusDto } from './dto/create-user-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Injectable()
export class UserStatusService {
  create(createUserStatusDto: CreateUserStatusDto) {
    return 'This action adds a new userStatus';
  }

  findAll() {
    return `This action returns all userStatus`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userStatus`;
  }

  update(id: number, updateUserStatusDto: UpdateUserStatusDto) {
    return `This action updates a #${id} userStatus`;
  }

  remove(id: number) {
    return `This action removes a #${id} userStatus`;
  }
}
