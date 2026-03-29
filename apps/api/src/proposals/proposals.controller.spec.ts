import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ProposalsController } from './proposals.controller';
import { ProposalsService } from './proposals.service';

describe('ProposalsController', () => {
  let controller: ProposalsController;

  const proposalsServiceMock = {
    create: jest.fn(),
    findAllForAdmin: jest.fn(),
    findMy: jest.fn(),
    findByRequest: jest.fn(),
    accept: jest.fn(),
  };

  const jwtAuthGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const rolesGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const setup = async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProposalsController],
      providers: [{ provide: ProposalsService, useValue: proposalsServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtAuthGuardMock)
      .overrideGuard(RolesGuard)
      .useValue(rolesGuardMock)
      .compile();

    controller = module.get(ProposalsController);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await setup();
  });

  it('create: should call service with user and dto', async () => {
    const req = {
      user: { sub: 'pro1', email: 'pro@test.com', role: UserRole.PROFESSIONAL },
    } as any;
    const dto = { requestId: '507f1f77bcf86cd799439501', price: 120 } as any;
    const created = { _id: 'pp1', ...dto };

    proposalsServiceMock.create.mockResolvedValue(created);

    const result = await controller.create(req, dto);

    expect(proposalsServiceMock.create).toHaveBeenCalledWith(req.user, dto);
    expect(result).toEqual(created);
  });

  it('findAllForAdmin: should return service data', async () => {
    const list = [{ _id: 'pp1' }, { _id: 'pp2' }];
    proposalsServiceMock.findAllForAdmin.mockResolvedValue(list);

    const result = await controller.findAllForAdmin();

    expect(proposalsServiceMock.findAllForAdmin).toHaveBeenCalledTimes(1);
    expect(result).toEqual(list);
  });

  it('findMy: should call service with professional user', async () => {
    const req = {
      user: { sub: 'pro2', email: 'pro2@test.com', role: UserRole.PROFESSIONAL },
    } as any;
    const list = [{ _id: 'pp3' }];

    proposalsServiceMock.findMy.mockResolvedValue(list);

    const result = await controller.findMy(req);

    expect(proposalsServiceMock.findMy).toHaveBeenCalledWith(req.user);
    expect(result).toEqual(list);
  });

  it('findByRequest: should call service with user and request id', async () => {
    const req = {
      user: { sub: 'c1', email: 'c@test.com', role: UserRole.CLIENT },
    } as any;
    const requestId = '507f1f77bcf86cd799439502';
    const list = [{ _id: 'pp4', requestId }];

    proposalsServiceMock.findByRequest.mockResolvedValue(list);

    const result = await controller.findByRequest(req, requestId);

    expect(proposalsServiceMock.findByRequest).toHaveBeenCalledWith(req.user, requestId);
    expect(result).toEqual(list);
  });

  it('findByRequest: should throw when service throws forbidden', async () => {
    const req = {
      user: { sub: 'c2', email: 'c2@test.com', role: UserRole.CLIENT },
    } as any;
    const requestId = '507f1f77bcf86cd799439599';

    proposalsServiceMock.findByRequest.mockRejectedValue(
      new ForbiddenException('You can only view proposals for your own requests'),
    );

    await expect(controller.findByRequest(req, requestId)).rejects.toThrow(
      ForbiddenException,
    );
    expect(proposalsServiceMock.findByRequest).toHaveBeenCalledWith(req.user, requestId);
  });

  it('accept: should call service with user and proposal id', async () => {
    const req = {
      user: { sub: 'c3', email: 'c3@test.com', role: UserRole.CLIENT },
    } as any;
    const id = '507f1f77bcf86cd799439503';
    const order = { _id: 'o1', proposalId: id };

    proposalsServiceMock.accept.mockResolvedValue(order);

    const result = await controller.accept(req, id);

    expect(proposalsServiceMock.accept).toHaveBeenCalledWith(req.user, id);
    expect(result).toEqual(order);
  });

  it('accept: should throw when service throws not found', async () => {
    const req = {
      user: { sub: 'c4', email: 'c4@test.com', role: UserRole.CLIENT },
    } as any;
    const id = '507f1f77bcf86cd799439598';

    proposalsServiceMock.accept.mockRejectedValue(
      new NotFoundException('Proposal not found'),
    );

    await expect(controller.accept(req, id)).rejects.toThrow(NotFoundException);
    expect(proposalsServiceMock.accept).toHaveBeenCalledWith(req.user, id);
  });
});