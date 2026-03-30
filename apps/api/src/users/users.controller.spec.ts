import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const usersServiceMock = {
    findAllForAdmin: jest.fn(),
    getMe: jest.fn(),
    updateMe: jest.fn(),
    uploadAvatar: jest.fn(),
    changePassword: jest.fn(),
    deleteMe: jest.fn(),
  };

  const jwtAuthGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const rolesGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const setup = async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtAuthGuardMock)
      .overrideGuard(RolesGuard)
      .useValue(rolesGuardMock)
      .compile();

    controller = module.get(UsersController);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await setup();
  });

  it('findAllForAdmin: should pass parsed filters to service', async () => {
    const req = {
      user: {
        sub: 'admin-1',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
      },
    } as any;
    const response = {
      data: [{ _id: 'u1', email: 'u1@test.com' }],
      pagination: { skip: 5, limit: 10, total: 1, pages: 1 },
    };

    usersServiceMock.findAllForAdmin.mockResolvedValue(response);

    const result = await controller.findAllForAdmin(
      req,
      'john',
      'CLIENT',
      '5',
      '10',
    );

    expect(usersServiceMock.findAllForAdmin).toHaveBeenCalledWith(req.user, {
      search: 'john',
      role: 'CLIENT',
      skip: 5,
      limit: 10,
    });
    expect(result).toEqual(response);
  });

  it('getMe: should return current user', async () => {
    const req = {
      user: { sub: 'user-1', email: 'user@test.com', role: UserRole.CLIENT },
    } as any;
    const me = { _id: 'user-1', email: 'user@test.com' };

    usersServiceMock.getMe.mockResolvedValue(me);

    const result = await controller.getMe(req);

    expect(usersServiceMock.getMe).toHaveBeenCalledWith(req.user);
    expect(result).toEqual(me);
  });

  it('getMe: should throw when service throws not found', async () => {
    const req = {
      user: { sub: 'missing-user', email: 'x@test.com', role: UserRole.CLIENT },
    } as any;
    const error = new NotFoundException('User not found');

    usersServiceMock.getMe.mockRejectedValue(error);

    await expect(controller.getMe(req)).rejects.toThrow(NotFoundException);
    expect(usersServiceMock.getMe).toHaveBeenCalledWith(req.user);
  });

  it('updateMe: should call service with user and dto', async () => {
    const req = {
      user: { sub: 'user-2', email: 'u2@test.com', role: UserRole.CLIENT },
    } as any;
    const dto = { firstName: 'John' } as any;
    const updated = { _id: 'user-2', firstName: 'John' };

    usersServiceMock.updateMe.mockResolvedValue(updated);

    const result = await controller.updateMe(req, dto);

    expect(usersServiceMock.updateMe).toHaveBeenCalledWith(req.user, dto);
    expect(result).toEqual(updated);
  });

  it('uploadAvatar: should call service with user and file', async () => {
    const req = {
      user: { sub: 'user-3', email: 'u3@test.com', role: UserRole.CLIENT },
    } as any;
    const file = { filename: 'avatar.jpg' } as Express.Multer.File;
    const updated = { _id: 'user-3', avatar: '/uploads/avatars/avatar.jpg' };

    usersServiceMock.uploadAvatar.mockResolvedValue(updated);

    const result = await controller.uploadAvatar(req, file);

    expect(usersServiceMock.uploadAvatar).toHaveBeenCalledWith(req.user, file);
    expect(result).toEqual(updated);
  });

  it('changePassword: should call service with user and dto', async () => {
    const req = {
      user: { sub: 'user-4', email: 'u4@test.com', role: UserRole.CLIENT },
    } as any;
    const dto = { currentPassword: 'old12345', newPassword: 'new12345' } as any;
    const response = { message: 'Password changed successfully' };

    usersServiceMock.changePassword.mockResolvedValue(response);

    const result = await controller.changePassword(req, dto);

    expect(usersServiceMock.changePassword).toHaveBeenCalledWith(req.user, dto);
    expect(result).toEqual(response);
  });

  it('deleteMe: should clear cookie and return service response', async () => {
    const req = {
      user: { sub: 'user-5', email: 'u5@test.com', role: UserRole.CLIENT },
    } as any;
    const res = { clearCookie: jest.fn() } as any;
    const response = { message: 'Account deleted successfully' };

    usersServiceMock.deleteMe.mockResolvedValue(response);

    const result = await controller.deleteMe(req, res);

    expect(usersServiceMock.deleteMe).toHaveBeenCalledWith(req.user);
    expect(res.clearCookie).toHaveBeenCalledTimes(1);
    expect(res.clearCookie).toHaveBeenCalledWith(
      'access_token',
      expect.objectContaining({ httpOnly: true, path: '/', sameSite: 'lax' }),
    );
    expect(result).toEqual(response);
  });

  it('deleteMe: should throw when service throws not found', async () => {
    const req = {
      user: { sub: 'missing-user', email: 'x@test.com', role: UserRole.CLIENT },
    } as any;
    const res = { clearCookie: jest.fn() } as any;
    const error = new NotFoundException('User not found');

    usersServiceMock.deleteMe.mockRejectedValue(error);

    await expect(controller.deleteMe(req, res)).rejects.toThrow(
      NotFoundException,
    );
    expect(res.clearCookie).not.toHaveBeenCalled();
  });
});
