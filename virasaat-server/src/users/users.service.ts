import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  Repository,
} from 'typeorm';

import {
  User,
} from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository:
      Repository<User>,
  ) {}

  async findById(id: string) {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  /**
   * passwordHash has select:false,
   * so explicitly select it.
   */
  async findByEmailWithPassword(
    email: string,
  ) {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where(
        'user.email = :email',
        { email },
      )
      .getOne();
  }

  async findByGoogleId(
    googleId: string,
  ) {
    return this.userRepository.findOne({
      where: { googleId },
    });
  }

  async create(
    data: Partial<User>,
  ) {
    const user =
      this.userRepository.create(data);

    return this.userRepository.save(user);
  }

  async update(
    id: string,
    data: Partial<Omit<User, 'vault' | 'recipients'>>,
  ) {
    await this.userRepository.update(
      id,
      data,
    );

    return this.findById(id);
  }

  async getProfile(id: string) {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      avatar: user.avatar,
      country: user.country,
      preferredLanguage: user.preferredLanguage,
      timezone: user.timezone,
    };
  }
}
