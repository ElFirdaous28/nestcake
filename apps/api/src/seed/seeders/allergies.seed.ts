import { Model } from 'mongoose'

export async function seedAllergies(allergyModel: Model<any>) {
    await allergyModel.deleteMany({})

    const allergies = [
        { name: 'Gluten' },
        { name: 'Nuts' },
        { name: 'Lactose' },
        { name: 'Egg' },
        { name: 'Soy' }
    ]

    const created = await allergyModel.insertMany(allergies)

    console.log('Allergies seeded')

    return created
}