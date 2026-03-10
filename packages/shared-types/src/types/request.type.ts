import { RequestStatus } from '../enums/request-status.enum'

export type Request = {
    id: string
    clientId: string
    title: string
    eventType?: string
    description: string
    allergyIds: string[]
    budget?: number
    deliveryDateTime: Date
    location: string
    status: RequestStatus
    createdAt: Date
}