export type Review = {
    id: string
    clientId: string
    professionalId: string
    orderId: string
    rating: number
    comment?: string
    createdAt: Date
}