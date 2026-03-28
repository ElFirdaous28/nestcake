import { Model } from 'mongoose';

export async function seedProducts(
  productModel: Model<any>,
  professionals: any[],
  categories: any[],
) {
  await productModel.deleteMany({});

  const products = [];

  for (let i = 1; i <= 15; i++) {
    const pro = professionals[i % professionals.length];
    const category = categories[i % categories.length];
    const status = i <= 10 ? 'published' : 'draft';

    products.push({
      name: `Cake ${i}`,
      description: 'Delicious custom cake',
      price: 20 + i,
      image: '/uploads/products/seed-placeholder.jpg',
      professionalId: pro._id,
      categoryIds: [category._id],
      status,
    });
  }

  const created = await productModel.insertMany(products);

  console.log('Products seeded');

  return created;
}
