import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { getModelToken } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { seedAllergies } from './seeders/allergies.seed'
import { seedUsers } from './seeders/users.seed'
import { seedProducts } from './seeders/products.seed'
import { seedRequests } from './seeders/requests.seed'
import { seedCategories } from './seeders/categories.seed'

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule)

    const categoryModel = app.get<Model<any>>(getModelToken('Category'))
    const allergyModel = app.get<Model<any>>(getModelToken('Allergy'))
    const userModel = app.get<Model<any>>(getModelToken('User'))
    const proModel = app.get<Model<any>>(getModelToken('Professional'))
    const productModel = app.get<Model<any>>(getModelToken('Product'))
    const requestModel = app.get<Model<any>>(getModelToken('Request'))

    const categories = await seedCategories(categoryModel)
    const allergies = await seedAllergies(allergyModel)
    const users = await seedUsers(userModel)
    await seedRequests(requestModel, users, allergies)

    console.log('Database fully seeded 🚀')

    await app.close()
}

bootstrap()