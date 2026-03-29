import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RequestStatus, UserRole } from '@shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

describe('RequestsController', () => {
  let controller: RequestsController;

  const requestsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findMyRequests: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateStatus: jest.fn(),
  };

  const jwtAuthGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const rolesGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const setup = async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [{ provide: RequestsService, useValue: requestsServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtAuthGuardMock)
      .overrideGuard(RolesGuard)
      .useValue(rolesGuardMock)
      .compile();

    controller = module.get(RequestsController);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await setup();
  });

  it('create: should call service with user, dto and file', async () => {
    const req = {
      user: { sub: 'u1', email: 'c@test.com', role: UserRole.CLIENT },
    } as any;
    const dto = { title: 'Need cake' } as any;
    const file = { filename: 'request.jpg' } as Express.Multer.File;
    const created = { _id: 'r1', title: 'Need cake' };

    requestsServiceMock.create.mockResolvedValue(created);

    const result = await controller.create(req, dto, file);

    expect(requestsServiceMock.create).toHaveBeenCalledWith(req.user, dto, file);
    expect(result).toEqual(created);
  });

  it('findAll: should call service with pagination and search', async () => {
    const response = { data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
    requestsServiceMock.findAll.mockResolvedValue(response);

    const result = await controller.findAll(1, 20, 'cake');

    expect(requestsServiceMock.findAll).toHaveBeenCalledWith(1, 20, 'cake');
    expect(result).toEqual(response);
  });

  it('findMyRequests: should call service with user and pagination', async () => {
    const req = {
      user: { sub: 'u2', email: 'c2@test.com', role: UserRole.CLIENT },
    } as any;
    const response = { data: [{ _id: 'r1' }], pagination: { page: 2, limit: 10, total: 1, pages: 1 } };

    requestsServiceMock.findMyRequests.mockResolvedValue(response);

    const result = await controller.findMyRequests(req, 2, 10);

    expect(requestsServiceMock.findMyRequests).toHaveBeenCalledWith(req.user, 2, 10);
    expect(result).toEqual(response);
  });

  it('findOne: should call service with id', async () => {
    const id = '507f1f77bcf86cd799439401';
    const request = { _id: id, title: 'Request 1' };
    requestsServiceMock.findOne.mockResolvedValue(request);

    const result = await controller.findOne(id);

    expect(requestsServiceMock.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(request);
  });

  it('findOne: should throw when service throws not found', async () => {
    const id = '507f1f77bcf86cd799439499';
    requestsServiceMock.findOne.mockRejectedValue(
      new NotFoundException('Request not found'),
    );

    await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    expect(requestsServiceMock.findOne).toHaveBeenCalledWith(id);
  });

  it('update: should call service with id, user, dto and file', async () => {
    const req = {
      user: { sub: 'u3', email: 'c3@test.com', role: UserRole.CLIENT },
    } as any;
    const id = '507f1f77bcf86cd799439402';
    const dto = { title: 'Updated title' } as any;
    const file = { filename: 'updated.jpg' } as Express.Multer.File;
    const updated = { _id: id, title: 'Updated title' };

    requestsServiceMock.update.mockResolvedValue(updated);

    const result = await controller.update(req, id, dto, file);

    expect(requestsServiceMock.update).toHaveBeenCalledWith(id, req.user, dto, file);
    expect(result).toEqual(updated);
  });

  it('remove: should call service with id and user', async () => {
    const req = {
      user: { sub: 'u4', email: 'c4@test.com', role: UserRole.CLIENT },
    } as any;
    const id = '507f1f77bcf86cd799439403';
    const response = { message: 'Request deleted successfully' };

    requestsServiceMock.remove.mockResolvedValue(response);

    const result = await controller.remove(req, id);

    expect(requestsServiceMock.remove).toHaveBeenCalledWith(id, req.user);
    expect(result).toEqual(response);
  });

  it('remove: should throw when service throws forbidden', async () => {
    const req = {
      user: { sub: 'u4', email: 'c4@test.com', role: UserRole.CLIENT },
    } as any;
    const id = '507f1f77bcf86cd799439498';
    requestsServiceMock.remove.mockRejectedValue(
      new ForbiddenException('You can only delete your own requests'),
    );

    await expect(controller.remove(req, id)).rejects.toThrow(ForbiddenException);
    expect(requestsServiceMock.remove).toHaveBeenCalledWith(id, req.user);
  });

  it('updateStatus: should call service with id, user and status', async () => {
    const req = {
      user: { sub: 'u5', email: 'c5@test.com', role: UserRole.CLIENT },
    } as any;
    const id = '507f1f77bcf86cd799439404';
    const response = { _id: id, status: RequestStatus.CANCELLED };

    requestsServiceMock.updateStatus.mockResolvedValue(response);

    const result = await controller.updateStatus(req, id, RequestStatus.CANCELLED);

    expect(requestsServiceMock.updateStatus).toHaveBeenCalledWith(
      id,
      req.user,
      RequestStatus.CANCELLED,
    );
    expect(result).toEqual(response);
  });
});