import { Model } from 'mongoose'

export async function seedUsers(userModel: Model<any>) {
    await userModel.deleteMany({})

    const users = []
    // creat one admin user
    users.push({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@gamil.com',
        password: 'password',
        role: 'ADMIN'
    })

    // creat one professional user
    users.push({
        firstName: 'Professional',
        lastName: 'User',
        email: 'pro@nestcake.com',
        password: 'password',
        role: 'PROFESSIONAL'
    })

    for (let i = 1; i <= 3; i++) {
        users.push({
            firstName: 'User',
            lastName: `${i}`,
            email: `user${i}@nestcake.com`,
            password: 'password',
            role: 'CLIENT'
        })
    }

    const created = await userModel.insertMany(users)

    console.log('Users seeded')

    return created
}