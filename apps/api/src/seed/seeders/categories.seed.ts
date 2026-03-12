import { Model } from 'mongoose'

export async function seedCategories(categoryModel: Model<any>) {
    await categoryModel.deleteMany({})

    const categories = [
        { name: 'Birthday Cake' },
        { name: 'Wedding Cake' },
        { name: 'Cupcakes' },
        { name: 'Baby Shower Cake' },
        { name: 'Dessert Cake' }
    ]

    const created = await categoryModel.insertMany(categories)

    console.log('Categories seeded')

    return created
}