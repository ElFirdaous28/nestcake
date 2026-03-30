import { Model } from 'mongoose';
import { UserRole } from '@shared-types';

export async function seedRequests(requestModel: Model<any>, users: any[], allergies: any[]) {
  await requestModel.deleteMany({});

  const clientUsers = users.filter((user) => user.role === UserRole.CLIENT);
  if (clientUsers.length === 0) {
    console.log('Requests skipped: no client users found');
    return [];
  }

  const requests = [];

  for (let i = 1; i <= 10; i++) {
    requests.push({
      title: `Custom Cake Request ${i}`,
      description: 'Need a custom cake',
      clientId: clientUsers[i % clientUsers.length]._id,
      allergyIds: [allergies[i % allergies.length]._id],
      budget: 50 + i * 10,
      deliveryDateTime: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
      location: 'Sarajevo',
      status: 'OPEN',
    });
  }

  const created = await requestModel.insertMany(requests);

  console.log('Requests seeded');

  return created;
}
