import { UserRole } from '@shared-types'
import { Model } from 'mongoose'
import * as bcrypt from 'bcryptjs';

export async function seedUsers(userModel: Model<any>) {
    await userModel.deleteMany({})

    // Shared hashed password for test users: "password"
    const password = await bcrypt.hash('password', 10)
    const users: any[] = []

    // Create one admin user
    users.push({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@nestcake.com',
        password,
        phone: '+38760000001',
        role: UserRole.ADMIN
    })

    // Create professionals
    users.push({
        firstName: 'Professional',
        lastName: 'User',
        email: 'pro@nestcake.com',
        password,
        phone: '+38760000002',
        role: UserRole.PROFESSIONAL
    })

    users.push({
        firstName: 'Professional',
        lastName: 'User2',
        email: 'pro2@nestcake.com',
        password,
        phone: '+38760000003',
        role: UserRole.PROFESSIONAL
    })

    for (let i = 1; i <= 3; i++) {
        users.push({
            firstName: 'User',
            lastName: `${i}`,
            email: `user${i}@nestcake.com`,
            password,
            phone: `+3876000000${i + 2}`,
            role: UserRole.CLIENT
        })
    }

    const created = await userModel.insertMany(users)

    console.log('Users seeded')

    return created
}