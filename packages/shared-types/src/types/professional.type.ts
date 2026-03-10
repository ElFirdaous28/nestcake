import { User } from "./user.type"

export type Professional = {
    id: string
    userId: string
    businessName: string
    description?: string
    verified: boolean
    location: string
}

// i should export it
export type ProfessionalWithUser = Professional & {
  user: User
}