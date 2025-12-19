import { prisma } from '@/lib/prisma'
import { Product, ProductStatus } from '@prisma/client'

export interface CreateProductData {
  branchId: string
  name: string
  description?: string
  category: string
  sku: string
  price: number
  costPrice?: number
  stockQuantity: number
  minStockLevel?: number
  taxRate?: number
  status?: ProductStatus
  imageUrl?: string
  barcode?: string
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string
}

export interface ProductFilters {
  branchId?: string
  category?: string
  status?: ProductStatus
  search?: string
  lowStock?: boolean
}

export class ProductService {
  static async createProduct(data: CreateProductData): Promise<Product> {
    return await prisma.product.create({
      data: {
        ...data,
        price: data.price,
        costPrice: data.costPrice || 0,
        taxRate: data.taxRate || 0,
      },
    })
  }

  static async updateProduct(data: UpdateProductData): Promise<Product> {
    const { id, ...updateData } = data
    return await prisma.product.update({
      where: { id },
      data: updateData,
    })
  }

  static async deleteProduct(id: string): Promise<void> {
    await prisma.product.delete({
      where: { id },
    })
  }

  static async getProduct(id: string): Promise<Product | null> {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        branch: true,
        inventoryMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
  }

  static async getProducts(filters: ProductFilters = {}, page = 1, limit = 20) {
    const where: any = {}

    if (filters.branchId) {
      where.branchId = filters.branchId
    }

    if (filters.category) {
      where.category = filters.category
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { barcode: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.lowStock) {
      where.stockQuantity = { lte: prisma.product.fields.minStockLevel }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          branch: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return {
      products,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  static async updateStock(productId: string, quantity: number, movementType: 'PURCHASE' | 'SALE' | 'ADJUSTMENT', reference?: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      throw new Error('Product not found')
    }

    let newQuantity = product.stockQuantity

    switch (movementType) {
      case 'PURCHASE':
      case 'ADJUSTMENT':
        newQuantity += quantity
        break
      case 'SALE':
        newQuantity -= quantity
        if (newQuantity < 0) {
          throw new Error('Insufficient stock')
        }
        break
    }

    await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: newQuantity },
      }),
      prisma.inventoryMovement.create({
        data: {
          branchId: product.branchId,
          productId,
          movementType,
          quantity,
          unitPrice: product.price,
          totalAmount: product.price * quantity,
          reference,
        },
      }),
    ])

    return newQuantity
  }

  static async getCategories(branchId?: string): Promise<string[]> {
    const products = await prisma.product.findMany({
      where: branchId ? { branchId } : {},
      select: { category: true },
      distinct: ['category'],
    })

    return products.map(p => p.category)
  }

  static async getLowStockProducts(branchId?: string) {
    return await prisma.product.findMany({
      where: {
        ...(branchId && { branchId }),
        stockQuantity: { lte: prisma.product.fields.minStockLevel },
        status: 'ACTIVE',
      },
      include: {
        branch: true,
      },
      orderBy: { stockQuantity: 'asc' },
    })
  }
}