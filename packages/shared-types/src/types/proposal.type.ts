import { ProposalStatus } from '../enums/proposal-status.enum'

export type Proposal = {
    id: string
    requestId: string
    professionalId: string
    price: number
    message?: string
    deliveryDateTime?: Date
    status: ProposalStatus
    createdAt: Date
}