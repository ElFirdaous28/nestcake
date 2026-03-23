import { RequestStatus } from '../enums/request-status.enum'
import { DeliveryType } from '../enums/delivery-type.enum'

export type Request = {
    id: string
    clientId: string
    title: string
    eventType?: string
    description: string
    allergyIds: string[]
    budget?: number
    deliveryDateTime: Date
    deliveryType: DeliveryType
    location?: string
    status: RequestStatus
    createdAt: Date
}