import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { getConnectionToken, getModelToken } from '@nestjs/mongoose'
import { Model, Connection } from 'mongoose'

import { seedAllergies } from './seeders/allergies.seed'
import { seedUsers } from './seeders/users.seed'
import { seedProfessionals } from './seeders/professionals.seed'
import { seedProducts } from './seeders/products.seed'
import { seedRequests } from './seeders/requests.seed'
import { seedCategories } from './seeders/categories.seed'

async function bootstrap() {
    const args = new Set(process.argv.slice(2))
    const isDropOnly = args.has('--drop')
    const isReset = args.has('--reset')

    const app = await NestFactory.createApplicationContext(AppModule)
    const connection = app.get<Connection>(getConnectionToken())

    if (isDropOnly) {
        await connection.dropDatabase()
        console.log('Database dropped')
        await app.close()
        return
    }

    const categoryModel = app.get<Model<any>>(getModelToken('Category'))
    const allergyModel = app.get<Model<any>>(getModelToken('Allergy'))
    const userModel = app.get<Model<any>>(getModelToken('User'))
    const professionalModel = app.get<Model<any>>(getModelToken('Professional'))
    const productModel = app.get<Model<any>>(getModelToken('Product'))
    const requestModel = app.get<Model<any>>(getModelToken('Request'))

    if (isReset) {
        await Promise.all([
            categoryModel.deleteMany({}),
            allergyModel.deleteMany({}),
            userModel.deleteMany({}),
            professionalModel.deleteMany({}),
            productModel.deleteMany({}),
            requestModel.deleteMany({}),
        ])
        console.log('Collections reset')
    }

    const categories = await seedCategories(categoryModel)
    const allergies = await seedAllergies(allergyModel)
    const users = await seedUsers(userModel)
    const professionals = await seedProfessionals(professionalModel, users)
    await seedProducts(productModel, professionals, categories)
    await seedRequests(requestModel, users, allergies)

    console.log('Database fully seeded 🚀')

    await app.close()
}

bootstrap()