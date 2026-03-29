import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProductStatus, UserRole } from '@shared-types';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('ProductsController', () => {
  let controller: ProductsController;

  const productsServiceMock = {
    create: jest.fn(),
    findProducts: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateProductStatus: jest.fn(),
    publishAllProducts: jest.fn(),
  };

  const jwtAuthGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const rolesGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const setup = async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: productsServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtAuthGuardMock)
      .overrideGuard(RolesGuard)
      .useValue(rolesGuardMock)
      .compile();

    controller = module.get(ProductsController);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await setup();
  });

  it('create: should call service with user, dto and file', async () => {
    const req = {
      user: {
        sub: 'user-1',
        email: 'pro@test.com',
        role: UserRole.PROFESSIONAL,
      },
    } as any;
    const dto = {
      name: 'Chocolate Cake',
      price: 120,
      categoryIds: ['507f1f77bcf86cd799439031'],
    } as any;
    const file = { filename: 'cake.jpg' } as Express.Multer.File;
    const created = { _id: 'p1', name: 'Chocolate Cake' };

    productsServiceMock.create.mockResolvedValue(created);

    const result = await controller.create(req, dto, file);

    expect(productsServiceMock.create).toHaveBeenCalledWith(req.user, dto, file);
    expect(result).toEqual(created);
  });

  it('findAllForClient: should call service with client scope', async () => {
    const query = { page: 1, limit: 20, search: 'cake' } as any;
    const list = { data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };

    productsServiceMock.findProducts.mockResolvedValue(list);

    const result = await controller.findAllForClient(query);

    expect(productsServiceMock.findProducts).toHaveBeenCalledWith({
      scope: 'client',
      options: query,
    });
    expect(result).toEqual(list);
  });

  it('findAllForProfessional: should call service with professional scope and user', async () => {
    const req = {
      user: {
        sub: 'user-2',
        email: 'pro2@test.com',
        role: UserRole.PROFESSIONAL,
      },
    } as any;
    const query = { page: 2, limit: 10 } as any;
    const list = { data: [{ _id: 'p1' }], pagination: { page: 2, limit: 10, total: 1, pages: 1 } };

    productsServiceMock.findProducts.mockResolvedValue(list);

    const result = await controller.findAllForProfessional(req, query);

    expect(productsServiceMock.findProducts).toHaveBeenCalledWith({
      scope: 'professional',
      authUser: req.user,
      options: query,
    });
    expect(result).toEqual(list);
  });

  it('findAllForAdmin: should call service with admin scope', async () => {
    const query = { page: 1, limit: 50 } as any;
    const list = { data: [{ _id: 'p1' }], pagination: { page: 1, limit: 50, total: 1, pages: 1 } };

    productsServiceMock.findProducts.mockResolvedValue(list);

    const result = await controller.findAllForAdmin(query);

    expect(productsServiceMock.findProducts).toHaveBeenCalledWith({
      scope: 'admin',
      options: query,
    });
    expect(result).toEqual(list);
  });

  it('findOne: should call service with id', async () => {
    const id = '507f1f77bcf86cd799439032';
    const product = { _id: id, name: 'Vanilla Cake' };

    productsServiceMock.findOne.mockResolvedValue(product);

    const result = await controller.findOne(id);

    expect(productsServiceMock.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(product);
  });

  it('findOne: should throw when service throws not found', async () => {
    const id = '507f1f77bcf86cd799439132';
    const error = new NotFoundException('Product not found');

    productsServiceMock.findOne.mockRejectedValue(error);

    await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    expect(productsServiceMock.findOne).toHaveBeenCalledWith(id);
  });

  it('update: should call service with id, user, dto and file', async () => {
    const req = {
      user: {
        sub: 'user-3',
        email: 'pro3@test.com',
        role: UserRole.PROFESSIONAL,
      },
    } as any;
    const id = '507f1f77bcf86cd799439033';
    const dto = { name: 'Updated Cake' } as any;
    const file = { filename: 'updated.jpg' } as Express.Multer.File;
    const updated = { _id: id, name: 'Updated Cake' };

    productsServiceMock.update.mockResolvedValue(updated);

    const result = await controller.update(req, id, dto, file);

    expect(productsServiceMock.update).toHaveBeenCalledWith(id, req.user, dto, file);
    expect(result).toEqual(updated);
  });

  it('remove: should call service with id and user', async () => {
    const req = {
      user: {
        sub: 'user-4',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
      },
    } as any;
    const id = '507f1f77bcf86cd799439034';
    const removed = { message: 'Product deleted successfully' };

    productsServiceMock.remove.mockResolvedValue(removed);

    const result = await controller.remove(req, id);

    expect(productsServiceMock.remove).toHaveBeenCalledWith(id, req.user);
    expect(result).toEqual(removed);
  });

  it('remove: should throw when service forbids removing product', async () => {
    const req = {
      user: {
        sub: 'user-44',
        email: 'pro@test.com',
        role: UserRole.PROFESSIONAL,
      },
    } as any;
    const id = '507f1f77bcf86cd799439134';
    const error = new ForbiddenException('You can only manage your own products');

    productsServiceMock.remove.mockRejectedValue(error);

    await expect(controller.remove(req, id)).rejects.toThrow(ForbiddenException);
    expect(productsServiceMock.remove).toHaveBeenCalledWith(id, req.user);
  });

  it('updateStatus: should call service with id, user and status', async () => {
    const req = {
      user: {
        sub: 'user-5',
        email: 'pro5@test.com',
        role: UserRole.PROFESSIONAL,
      },
    } as any;
    const id = '507f1f77bcf86cd799439035';
    const status = ProductStatus.PUBLISHED;
    const updated = { _id: id, status: ProductStatus.PUBLISHED };

    productsServiceMock.updateProductStatus.mockResolvedValue(updated);

    const result = await controller.updateStatus(req, id, status);

    expect(productsServiceMock.updateProductStatus).toHaveBeenCalledWith(
      id,
      req.user,
      status,
    );
    expect(result).toEqual(updated);
  });

  it('publishAll: should call service with user', async () => {
    const req = {
      user: {
        sub: 'user-6',
        email: 'pro6@test.com',
        role: UserRole.PROFESSIONAL,
      },
    } as any;
    const response = { message: '5 products published' };

    productsServiceMock.publishAllProducts.mockResolvedValue(response);

    const result = await controller.publishAll(req);

    expect(productsServiceMock.publishAllProducts).toHaveBeenCalledWith(req.user);
    expect(result).toEqual(response);
  });

  it('publishAll: should throw when service rejects operation', async () => {
    const req = {
      user: {
        sub: 'user-66',
        email: 'pro66@test.com',
        role: UserRole.PROFESSIONAL,
      },
    } as any;
    const error = new ForbiddenException('Only verified professionals can publish products');

    productsServiceMock.publishAllProducts.mockRejectedValue(error);

    await expect(controller.publishAll(req)).rejects.toThrow(ForbiddenException);
    expect(productsServiceMock.publishAllProducts).toHaveBeenCalledWith(req.user);
  });
});