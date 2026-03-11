import { UserRole } from '@shared-types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    const role: UserRole = UserRole.ADMIN;
    console.log(`User role is: ${role}`);
    return 'Hello World!';
  }

  // Use them in your code
}
