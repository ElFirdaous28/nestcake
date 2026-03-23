import { ProductStatus } from '../enums/product-status.enum'

export type Product = {
    id: string
    professionalId: string
    name: string
    description?: string
    price: number
    categoryIds: string[]
    isAvailable: boolean
    status: ProductStatus
}