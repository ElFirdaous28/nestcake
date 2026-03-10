import { OrderStatus } from '../enums/order-status.enum'
import { OrderType } from '../enums/order-type.enum'

export type Order = {
    id: string
    clientId: string
    professionalId: string
    type: OrderType
    requestId?: string
    proposalId?: string
    totalPrice: number
    status: OrderStatus
    createdAt: Date
}