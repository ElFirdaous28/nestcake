import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AllergiesController } from './allergies.controller';
import { AllergiesService } from './allergies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('AllergiesController', () => {
  let controller: AllergiesController;

  const allergiesServiceMock = {
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
      controllers: [AllergiesController],
      providers: [
        {
          provide: AllergiesService,
          useValue: allergiesServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtAuthGuardMock)
      .overrideGuard(RolesGuard)
      .useValue(rolesGuardMock)
      .compile();

    controller = module.get(AllergiesController);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await setup();
  });

  it('create: should call service with dto', async () => {
    const dto = { name: 'Gluten' } as any;
    const created = { _id: 'a1', name: 'Gluten' };

    allergiesServiceMock.create.mockResolvedValue(created);

    const result = await controller.create(dto);

    expect(allergiesServiceMock.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(created);
  });

  it('findAll: should return list', async () => {
    const list = [
      { _id: 'a1', name: 'Gluten' },
      { _id: 'a2', name: 'Peanut' },
    ];

    allergiesServiceMock.findAll.mockResolvedValue(list);

    const result = await controller.findAll();

    expect(allergiesServiceMock.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(list);
  });

  it('findOne: should call service with id', async () => {
    const id = '507f1f77bcf86cd799439011';
    const allergy = { _id: id, name: 'Lactose' };

    allergiesServiceMock.findOne.mockResolvedValue(allergy);

    const result = await controller.findOne(id);

    expect(allergiesServiceMock.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(allergy);
  });

  it('findOne: should throw when service throws not found', async () => {
    const id = '507f1f77bcf86cd799439099';
    const error = new NotFoundException('Allergy not found');

    allergiesServiceMock.findOne.mockRejectedValue(error);

    await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    expect(allergiesServiceMock.findOne).toHaveBeenCalledWith(id);
  });

  it('update: should call service with id and dto', async () => {
    const id = '507f1f77bcf86cd799439012';
    const dto = { name: 'Soy' } as any;
    const updated = { _id: id, name: 'Soy' };

    allergiesServiceMock.update.mockResolvedValue(updated);

    const result = await controller.update(id, dto);

    expect(allergiesServiceMock.update).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(updated);
  });

  it('remove: should call service with id', async () => {
    const id = '507f1f77bcf86cd799439013';
    const removed = { message: 'Allergy deleted successfully' };

    allergiesServiceMock.remove.mockResolvedValue(removed);

    const result = await controller.remove(id);

    expect(allergiesServiceMock.remove).toHaveBeenCalledWith(id);
    expect(result).toEqual(removed);
  });

  it('remove: should throw when service throws not found', async () => {
    const id = '507f1f77bcf86cd799439098';
    const error = new NotFoundException('Allergy not found');

    allergiesServiceMock.remove.mockRejectedValue(error);

    await expect(controller.remove(id)).rejects.toThrow(NotFoundException);
    expect(allergiesServiceMock.remove).toHaveBeenCalledWith(id);
  });
});
