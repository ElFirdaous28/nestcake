import { UserRole } from '../enums/user-role.enum'

export type User = {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    avatar?: string
    role: UserRole
    createdAt: Date
}