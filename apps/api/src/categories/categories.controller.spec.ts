import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('CategoriesController', () => {
  let controller: CategoriesController;

  const categoriesServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const jwtAuthGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const rolesGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const setup = async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: categoriesServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtAuthGuardMock)
      .overrideGuard(RolesGuard)
      .useValue(rolesGuardMock)
      .compile();

    controller = module.get(CategoriesController);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await setup();
  });

  it('create: should call service with dto', async () => {
    const dto = { name: 'Birthday' } as any;
    const created = { _id: 'c1', name: 'Birthday' };

    categoriesServiceMock.create.mockResolvedValue(created);

    const result = await controller.create(dto);

    expect(categoriesServiceMock.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(created);
  });

  it('findAll: should return list', async () => {
    const list = [
      { _id: 'c1', name: 'Birthday' },
      { _id: 'c2', name: 'Wedding' },
    ];

    categoriesServiceMock.findAll.mockResolvedValue(list);

    const result = await controller.findAll();

    expect(categoriesServiceMock.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(list);
  });

  it('findOne: should call service with id', async () => {
    const id = '507f1f77bcf86cd799439021';
    const category = { _id: id, name: 'Cupcakes' };

    categoriesServiceMock.findOne.mockResolvedValue(category);

    const result = await controller.findOne(id);

    expect(categoriesServiceMock.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(category);
  });

  it('findOne: should throw when service throws not found', async () => {
    const id = '507f1f77bcf86cd799439199';
    const error = new NotFoundException('Category not found');

    categoriesServiceMock.findOne.mockRejectedValue(error);

    await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    expect(categoriesServiceMock.findOne).toHaveBeenCalledWith(id);
  });

  it('update: should call service with id and dto', async () => {
    const id = '507f1f77bcf86cd799439022';
    const dto = { name: 'Anniversary' } as any;
    const updated = { _id: id, name: 'Anniversary' };

    categoriesServiceMock.update.mockResolvedValue(updated);

    const result = await controller.update(id, dto);

    expect(categoriesServiceMock.update).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(updated);
  });

  it('remove: should call service with id', async () => {
    const id = '507f1f77bcf86cd799439023';
    const removed = { message: 'Category deleted successfully' };

    categoriesServiceMock.remove.mockResolvedValue(removed);

    const result = await controller.remove(id);

    expect(categoriesServiceMock.remove).toHaveBeenCalledWith(id);
    expect(result).toEqual(removed);
  });

  it('remove: should throw when service throws not found', async () => {
    const id = '507f1f77bcf86cd799439198';
    const error = new NotFoundException('Category not found');

    categoriesServiceMock.remove.mockRejectedValue(error);

    await expect(controller.remove(id)).rejects.toThrow(NotFoundException);
    expect(categoriesServiceMock.remove).toHaveBeenCalledWith(id);
  });
});