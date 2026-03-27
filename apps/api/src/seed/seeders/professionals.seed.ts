import { ProfessionalVerificationStatus, UserRole } from '@shared-types';
import { Model } from 'mongoose';

export async function seedProfessionals(
  professionalModel: Model<any>,
  users: any[],
) {
  await professionalModel.deleteMany({});

  const professionalUsers = users.filter(
    (user) => user.role === UserRole.PROFESSIONAL,
  );

  const professionals = professionalUsers.map((user, index) => ({
    userId: user._id,
    businessName: `${user.firstName} Cakes`,
    description: 'Custom cakes, cupcakes, and event desserts',
    verified: false,
    address: `Main Street ${index + 1}, Sarajevo`,
    location: {
      type: 'Point',
      coordinates: [18.4131 + index * 0.01, 43.8563 + index * 0.01],
    },
    verificationStatus: ProfessionalVerificationStatus.PENDING,
    portfolio: [
      {
        title: 'Signature Cake',
        description: 'Sample portfolio item',
        images: ['https://picsum.photos/seed/nestcake-portfolio-1/800/600'],
      },
    ],
  }));

  const created = await professionalModel.insertMany(professionals);

  console.log('Professionals seeded');

  return created;
}
