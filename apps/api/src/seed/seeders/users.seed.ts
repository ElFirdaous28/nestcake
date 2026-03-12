import { UserRole } from '@shared-types'
import { Model } from 'mongoose'
import * as bcrypt from 'bcryptjs';

export async function seedUsers(userModel: Model<any>) {
    await userModel.deleteMany({})
    // hashed password
    const password = await bcrypt.hash('password', 10)
    const users = []
    // creat one admin user
    users.push({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@nestcake.com',
        password,
        role: UserRole.ADMIN
    })

    // creat one professional user
    users.push({
        firstName: 'Professional',
        lastName: 'User',
        email: 'pro@nestcake.com',
        password,
        role: UserRole.PROFESSIONAL
    })

    for (let i = 1; i <= 3; i++) {
        users.push({
            firstName: 'User',
            lastName: `${i}`,
            email: `user${i}@nestcake.com`,
            password,
            role: UserRole.CLIENT
        })
    }

    const created = await userModel.insertMany(users)

    console.log('Users seeded')

    return created
}