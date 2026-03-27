import { Model } from 'mongoose';

export async function seedCategories(categoryModel: Model<any>) {
  await categoryModel.deleteMany({});

  const categories: Array<{ name: string }> = [
    { name: 'Birthday Cake' },
    { name: 'Wedding Cake' },
    { name: 'Anniversary Cake' },
    { name: 'Baby Shower Cake' },
    { name: 'Graduation Cake' },
    { name: 'Cupcakes' },
    { name: 'Cheesecake' },
    { name: 'Chocolate Cake' },
    { name: 'Vanilla Cake' },
    { name: 'Dessert Cake' },
  ];

  const created = await categoryModel.insertMany(categories);

  console.log('Categories seeded');

  return created;
}
