import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;

  const ordersServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findClientOrders: jest.fn(),
    findProfessionalOrders: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    removeItem: jest.fn(),
    markPaid: jest.fn(),
    markReady: jest.fn(),
    reject: jest.fn(),
    complete: jest.fn(),
  };

  const jwtAuthGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const rolesGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const setup = async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: ordersServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtAuthGuardMock)
      .overrideGuard(RolesGuard)
      .useValue(rolesGuardMock)
      .compile();

    controller = module.get(OrdersController);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await setup();
  });

  it('create: should call service with user and dto', async () => {
    const req = {
      user: { sub: 'c1', email: 'c1@test.com', role: UserRole.CLIENT },
    } as any;
    const dto = {
      items: [{ productId: '507f1f77bcf86cd799439601', quantity: 2 }],
    } as any;
    const order = { _id: 'o1', totalPrice: 200 };

    ordersServiceMock.create.mockResolvedValue(order);

    const result = await controller.create(req, dto);

    expect(ordersServiceMock.create).toHaveBeenCalledWith(req.user, dto);
    expect(result).toEqual(order);
  });

  it('findAll: should call service with query', async () => {
    const query = { page: 1, limit: 20 } as any;
    const response = {
      data: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    };

    ordersServiceMock.findAll.mockResolvedValue(response);

    const result = await controller.findAll(query);

    expect(ordersServiceMock.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual(response);
  });

  it('findClientOrders: should call service with user and query', async () => {
    const req = {
      user: { sub: 'c2', email: 'c2@test.com', role: UserRole.CLIENT },
    } as any;
    const query = { status: 'AWAITING_PAYMENT' } as any;
    const response = {
      data: [{ _id: 'o2' }],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    };

    ordersServiceMock.findClientOrders.mockResolvedValue(response);

    const result = await controller.findClientOrders(req, query);

    expect(ordersServiceMock.findClientOrders).toHaveBeenCalledWith(req.user, query);
    expect(result).toEqual(response);
  });

  it('findProfessionalOrders: should call service with user and query', async () => {
    const req = {
      user: { sub: 'p1', email: 'p1@test.com', role: UserRole.PROFESSIONAL },
    } as any;
    const query = { page: 2, limit: 10 } as any;
    const response = {
      data: [{ _id: 'o3' }],
      pagination: { page: 2, limit: 10, total: 1, pages: 1 },
    };

    ordersServiceMock.findProfessionalOrders.mockResolvedValue(response);

    const result = await controller.findProfessionalOrders(req, query);

    expect(ordersServiceMock.findProfessionalOrders).toHaveBeenCalledWith(req.user, query);
    expect(result).toEqual(response);
  });

  it('findOne: should call service with id', async () => {
    const id = '507f1f77bcf86cd799439602';
    const order = { _id: id, status: 'READY' };

    ordersServiceMock.findOne.mockResolvedValue(order);

    const result = await controller.findOne(id);

    expect(ordersServiceMock.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(order);
  });

  it('findOne: should throw when service throws not found', async () => {
    const id = '507f1f77bcf86cd799439699';

    ordersServiceMock.findOne.mockRejectedValue(new NotFoundException('Order not found'));

    await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    expect(ordersServiceMock.findOne).toHaveBeenCalledWith(id);
  });

  it('remove: should call service with id and user', async () => {
    const req = {
      user: { sub: 'c3', email: 'c3@test.com', role: UserRole.CLIENT },
    } as any;
    const id = '507f1f77bcf86cd799439603';
    const response = { message: 'Order deleted successfully' };

    ordersServiceMock.remove.mockResolvedValue(response);

    const result = await controller.remove(req, id);

    expect(ordersServiceMock.remove).toHaveBeenCalledWith(id, req.user);
    expect(result).toEqual(response);
  });

  it('removeItem: should call service with order id, product id and user', async () => {
    const req = {
      user: { sub: 'c4', email: 'c4@test.com', role: UserRole.CLIENT },
    } as any;
    const id = '507f1f77bcf86cd799439604';
    const productId = '507f1f77bcf86cd799439605';
    const order = { _id: id, items: [] };

    ordersServiceMock.removeItem.mockResolvedValue(order);

    const result = await controller.removeItem(req, id, productId);

    expect(ordersServiceMock.removeItem).toHaveBeenCalledWith(id, productId, req.user);
    expect(result).toEqual(order);
  });

  it('markPaid: should call service with id and user', async () => {
    const req = {
      user: { sub: 'c5', email: 'c5@test.com', role: UserRole.CLIENT },
    } as any;
    const id = '507f1f77bcf86cd799439606';
    const order = { _id: id, status: 'IN_PROGRESS' };

    ordersServiceMock.markPaid.mockResolvedValue(order);

    const result = await controller.markPaid(req, id);

    expect(ordersServiceMock.markPaid).toHaveBeenCalledWith(id, req.user);
    expect(result).toEqual(order);
  });

  it('markReady: should call service with id and user', async () => {
    const req = {
      user: { sub: 'p2', email: 'p2@test.com', role: UserRole.PROFESSIONAL },
    } as any;
    const id = '507f1f77bcf86cd799439607';
    const order = { _id: id, status: 'READY' };

    ordersServiceMock.markReady.mockResolvedValue(order);

    const result = await controller.markReady(req, id);

    expect(ordersServiceMock.markReady).toHaveBeenCalledWith(id, req.user);
    expect(result).toEqual(order);
  });

  it('reject: should call service with id and user', async () => {
    const req = {
      user: { sub: 'p3', email: 'p3@test.com', role: UserRole.PROFESSIONAL },
    } as any;
    const id = '507f1f77bcf86cd799439608';
    const order = { _id: id, status: 'CANCELLED' };

    ordersServiceMock.reject.mockResolvedValue(order);

    const result = await controller.reject(req, id);

    expect(ordersServiceMock.reject).toHaveBeenCalledWith(id, req.user);
    expect(result).toEqual(order);
  });

  it('complete: should call service with id and user', async () => {
    const req = {
      user: { sub: 'c6', email: 'c6@test.com', role: UserRole.CLIENT },
    } as any;
    const id = '507f1f77bcf86cd799439609';
    const order = { _id: id, status: 'COMPLETED' };

    ordersServiceMock.complete.mockResolvedValue(order);

    const result = await controller.complete(req, id);

    expect(ordersServiceMock.complete).toHaveBeenCalledWith(id, req.user);
    expect(result).toEqual(order);
  });

  it('complete: should throw when service throws bad request', async () => {
    const req = {
      user: { sub: 'c6', email: 'c6@test.com', role: UserRole.CLIENT },
    } as any;
    const id = '507f1f77bcf86cd799439698';

    ordersServiceMock.complete.mockRejectedValue(
      new BadRequestException('Only ready orders can be completed'),
    );

    await expect(controller.complete(req, id)).rejects.toThrow(BadRequestException);
    expect(ordersServiceMock.complete).toHaveBeenCalledWith(id, req.user);
  });
});
