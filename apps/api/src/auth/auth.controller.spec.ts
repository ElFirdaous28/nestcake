import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@shared-types';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    registerUser: jest.fn(),
    registerProfessional: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    getMe: jest.fn(),
  };

  const jwtAuthGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const authResult = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: {
      sub: 'user-id',
      email: 'user@example.com',
      role: UserRole.CLIENT,
    },
  };

  const createResponse = () => ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  });

  const expectCookiesSet = (res) => {
    expect(res.cookie).toHaveBeenCalledTimes(2);

    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      authResult.accessToken,
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );

    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      authResult.refreshToken,
      expect.objectContaining({ httpOnly: true, path: '/api/auth' }),
    );
  };

  const setup = async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtAuthGuardMock)
      .compile();

    controller = module.get(AuthController);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await setup();
  });

  // ---------------- REGISTER USER ----------------
  it('registerUser: should call service, set cookies and return data', async () => {
    const dto = { email: 'john@test.com', password: '123456' } as any;
    const res = createResponse();

    authServiceMock.registerUser.mockResolvedValue(authResult);

    const result = await controller.registerUser(dto, res as any);

    expect(authServiceMock.registerUser).toHaveBeenCalledTimes(1);
    expect(authServiceMock.registerUser).toHaveBeenCalledWith(dto);

    expectCookiesSet(res);

    expect(result).toEqual({
      accessToken: authResult.accessToken,
      user: authResult.user,
    });
  });

  it('registerUser: should propagate error if service fails', async () => {
    const dto = { email: 'fail@test.com' } as any;
    const res = createResponse();

    authServiceMock.registerUser.mockRejectedValue(new Error('DB error'));

    await expect(controller.registerUser(dto, res as any)).rejects.toThrow(
      'DB error',
    );

    expect(res.cookie).not.toHaveBeenCalled();
  });

  // ---------------- REGISTER PRO ----------------
  it('registerProfessional: should behave like registerUser', async () => {
    const dto = { email: 'pro@test.com' } as any;
    const res = createResponse();

    authServiceMock.registerProfessional.mockResolvedValue(authResult);

    const result = await controller.registerProfessional(dto, res as any);

    expect(authServiceMock.registerProfessional).toHaveBeenCalledWith(dto);
    expectCookiesSet(res);

    expect(result).toMatchObject({
      accessToken: authResult.accessToken,
      user: authResult.user,
    });
  });

  it('registerProfessional: should throw if service fails', async () => {
    const dto = {} as any;
    const res = createResponse();

    authServiceMock.registerProfessional.mockRejectedValue(new Error('fail'));

    await expect(
      controller.registerProfessional(dto, res as any),
    ).rejects.toThrow('fail');

    expect(res.cookie).not.toHaveBeenCalled();
  });

  // ---------------- LOGIN ----------------
  it('login: should authenticate and set cookies', async () => {
    const dto = { email: 'user@test.com', password: '123' } as any;
    const res = createResponse();

    authServiceMock.login.mockResolvedValue(authResult);

    const result = await controller.login(dto, res as any);

    expect(authServiceMock.login).toHaveBeenCalledWith(dto);
    expectCookiesSet(res);

    expect(result.user).toEqual(authResult.user);
  });

  it('login: should throw on invalid credentials', async () => {
    const dto = { email: 'wrong@test.com', password: 'bad' } as any;
    const res = createResponse();

    authServiceMock.login.mockRejectedValue(
      new UnauthorizedException('Invalid credentials'),
    );

    await expect(controller.login(dto, res as any)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(res.cookie).not.toHaveBeenCalled();
  });

  // ---------------- REFRESH ----------------
  it('refresh: should throw if no token', async () => {
    const req = { cookies: {} };
    const res = createResponse();

    await expect(controller.refresh(req as any, res as any)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(authServiceMock.refresh).not.toHaveBeenCalled();
  });

  it('refresh: should refresh tokens', async () => {
    const req = { cookies: { refresh_token: 'old-token' } };
    const res = createResponse();

    authServiceMock.refresh.mockResolvedValue(authResult);

    const result = await controller.refresh(req as any, res as any);

    expect(authServiceMock.refresh).toHaveBeenCalledWith('old-token');
    expectCookiesSet(res);

    expect(result.accessToken).toBe(authResult.accessToken);
  });

  it('refresh: should throw if refresh token is invalid', async () => {
    const req = { cookies: { refresh_token: 'bad-token' } };
    const res = createResponse();

    authServiceMock.refresh.mockRejectedValue(
      new UnauthorizedException('Invalid token'),
    );

    await expect(controller.refresh(req as any, res as any)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(res.cookie).not.toHaveBeenCalled();
  });

  // ---------------- LOGOUT ----------------
  it('logout: should clear cookies', async () => {
    const req = { cookies: { refresh_token: 'token' } };
    const res = createResponse();

    await controller.logout(req as any, res as any);

    expect(authServiceMock.logout).toHaveBeenCalledWith('token');

    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(res.clearCookie).toHaveBeenCalledWith('access_token', { path: '/' });
    expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', {
      path: '/api/auth',
    });
  });

  it('logout: should propagate error if service fails', async () => {
    const req = { cookies: { refresh_token: 'token' } };
    const res = createResponse();

    authServiceMock.logout.mockRejectedValue(new Error('fail'));

    await expect(controller.logout(req as any, res as any)).rejects.toThrow(
      'fail',
    );

    expect(res.clearCookie).not.toHaveBeenCalled();
  });

  // ---------------- GET ME ----------------
  it('getMe: should return current user', async () => {
    const req = { user: { sub: 'id' } };
    const user = { _id: 'id', email: 'test@test.com' };

    authServiceMock.getMe.mockResolvedValue(user);

    const result = await controller.getMe(req as any);

    expect(authServiceMock.getMe).toHaveBeenCalledWith(req.user);
    expect(result).toEqual(user);
  });

  it('getMe: should throw if service fails', async () => {
    const req = { user: { sub: 'id' } };

    authServiceMock.getMe.mockRejectedValue(new Error('User not found'));

    await expect(controller.getMe(req as any)).rejects.toThrow(
      'User not found',
    );
  });
});
