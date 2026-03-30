import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProfessionalVerificationStatus, UserRole } from '@shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ProfessionalsController } from './professionals.controller';
import { ProfessionalsService } from './professionals.service';

describe('ProfessionalsController', () => {
  let controller: ProfessionalsController;

  const professionalsServiceMock = {
    findAll: jest.fn(),
    getMe: jest.fn(),
    updateMe: jest.fn(),
    addPortfolioItem: jest.fn(),
    removePortfolioItem: jest.fn(),
    updateVerification: jest.fn(),
    findOne: jest.fn(),
  };

  const jwtAuthGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const rolesGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const setup = async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfessionalsController],
      providers: [
        {
          provide: ProfessionalsService,
          useValue: professionalsServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtAuthGuardMock)
      .overrideGuard(RolesGuard)
      .useValue(rolesGuardMock)
      .compile();

    controller = module.get(ProfessionalsController);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await setup();
  });

  it('findAll: should return all professionals', async () => {
    const list = [{ _id: 'p1' }, { _id: 'p2' }];

    professionalsServiceMock.findAll.mockResolvedValue(list);

    const result = await controller.findAll();

    expect(professionalsServiceMock.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(list);
  });

  it('getMe: should call service with current user', async () => {
    const req = {
      user: {
        sub: 'pro-1',
        email: 'pro@test.com',
        role: UserRole.PROFESSIONAL,
      },
    } as any;
    const me = { _id: 'prof-1', userId: 'pro-1' };

    professionalsServiceMock.getMe.mockResolvedValue(me);

    const result = await controller.getMe(req);

    expect(professionalsServiceMock.getMe).toHaveBeenCalledWith(req.user);
    expect(result).toEqual(me);
  });

  it('updateMe: should call service with user and dto', async () => {
    const req = {
      user: {
        sub: 'pro-2',
        email: 'pro2@test.com',
        role: UserRole.PROFESSIONAL,
      },
    } as any;
    const dto = { businessName: 'Cake House' } as any;
    const updated = { _id: 'prof-2', businessName: 'Cake House' };

    professionalsServiceMock.updateMe.mockResolvedValue(updated);

    const result = await controller.updateMe(req, dto);

    expect(professionalsServiceMock.updateMe).toHaveBeenCalledWith(
      req.user,
      dto,
    );
    expect(result).toEqual(updated);
  });

  it('addPortfolioItem: should call service with user, file and dto', async () => {
    const req = {
      user: {
        sub: 'pro-3',
        email: 'pro3@test.com',
        role: UserRole.PROFESSIONAL,
      },
    } as any;
    const file = { filename: 'work.jpg' } as Express.Multer.File;
    const dto = { title: 'Wedding cake' } as any;
    const updated = {
      _id: 'prof-3',
      portfolio: [{ images: ['/uploads/portfolio/work.jpg'] }],
    };

    professionalsServiceMock.addPortfolioItem.mockResolvedValue(updated);

    const result = await controller.addPortfolioItem(req, file, dto);

    expect(professionalsServiceMock.addPortfolioItem).toHaveBeenCalledWith(
      req.user,
      file,
      dto,
    );
    expect(result).toEqual(updated);
  });

  it('removePortfolioItem: should call service with user and item id', async () => {
    const req = {
      user: {
        sub: 'pro-4',
        email: 'pro4@test.com',
        role: UserRole.PROFESSIONAL,
      },
    } as any;
    const portfolioItemId = '507f1f77bcf86cd799439301';
    const updated = { _id: 'prof-4', portfolio: [] };

    professionalsServiceMock.removePortfolioItem.mockResolvedValue(updated);

    const result = await controller.removePortfolioItem(req, portfolioItemId);

    expect(professionalsServiceMock.removePortfolioItem).toHaveBeenCalledWith(
      req.user,
      portfolioItemId,
    );
    expect(result).toEqual(updated);
  });

  it('updateVerification: should call service with id and dto', async () => {
    const professionalId = '507f1f77bcf86cd799439302';
    const dto = {
      verificationStatus: ProfessionalVerificationStatus.VERIFIED,
    } as any;
    const updated = {
      _id: professionalId,
      verificationStatus: dto.verificationStatus,
    };

    professionalsServiceMock.updateVerification.mockResolvedValue(updated);

    const result = await controller.updateVerification(professionalId, dto);

    expect(professionalsServiceMock.updateVerification).toHaveBeenCalledWith(
      professionalId,
      dto,
    );
    expect(result).toEqual(updated);
  });

  it('findOne: should call service with id', async () => {
    const id = '507f1f77bcf86cd799439303';
    const professional = { _id: id, businessName: 'Cake Pro' };

    professionalsServiceMock.findOne.mockResolvedValue(professional);

    const result = await controller.findOne(id);

    expect(professionalsServiceMock.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(professional);
  });

  it('findOne: should throw when service throws not found', async () => {
    const id = '507f1f77bcf86cd799439399';
    const error = new NotFoundException('Professional not found');

    professionalsServiceMock.findOne.mockRejectedValue(error);

    await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    expect(professionalsServiceMock.findOne).toHaveBeenCalledWith(id);
  });

  it('updateVerification: should throw when service throws not found', async () => {
    const professionalId = '507f1f77bcf86cd799439398';
    const dto = {
      verificationStatus: ProfessionalVerificationStatus.REJECTED,
    } as any;
    const error = new NotFoundException('Professional not found');

    professionalsServiceMock.updateVerification.mockRejectedValue(error);

    await expect(
      controller.updateVerification(professionalId, dto),
    ).rejects.toThrow(NotFoundException);
    expect(professionalsServiceMock.updateVerification).toHaveBeenCalledWith(
      professionalId,
      dto,
    );
  });
});
