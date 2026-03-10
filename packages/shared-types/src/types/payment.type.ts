import { PaymentStatus } from '../enums/payment-status.enum'

export type Payment = {
    id: string
    orderId: string
    amount: number
    status: PaymentStatus
    stripeTransactionId?: string
    createdAt: Date
}