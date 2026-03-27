import { UserRole } from '../enums/user-role.enum'

export type AuthUser = {
    sub: string
    email: string
    role: UserRole
    avatar?: string
}
