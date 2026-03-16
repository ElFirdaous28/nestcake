import { User } from "./user.type"
import { ProfessionalVerificationStatus } from '../enums/professional-verification-status.enum'
import { PortfolioItem } from './portfolio-item.type'

export type Professional = {
    id: string
    userId: string
    businessName: string
    description?: string
    verified: boolean
  address: string
  verificationStatus: ProfessionalVerificationStatus
  location: {
    type: 'Point'
    coordinates: [number, number]
  }
  portfolio: PortfolioItem[]
}

export type ProfessionalWithUser = Professional & {
  user: User
}