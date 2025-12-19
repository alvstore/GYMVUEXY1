import { NextRequest, NextResponse } from 'next/server'
import { ProductService } from '@/lib/services/productService'
import { RBACService } from '@/lib/rbac'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'products.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || undefined
    const category = searchParams.get('category') || undefined
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined
    const lowStock = searchParams.get('lowStock') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await ProductService.getProducts({
      branchId,
      category,
      status: status as any,
      search,
      lowStock,
    }, page, limit)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'products.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      branchId,
      name,
      description,
      category,
      sku,
      price,
      costPrice,
      stockQuantity,
      minStockLevel,
      taxRate,
      status,
      imageUrl,
      barcode,
    } = body

    // Validate required fields
    if (!branchId || !name || !category || !sku || !price) {
      return NextResponse.json(
        { error: 'Branch ID, name, category, SKU, and price are required' },
        { status: 400 }
      )
    }

    const product = await ProductService.createProduct({
      branchId,
      name,
      description,
      category,
      sku,
      price: parseFloat(price),
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      stockQuantity: parseInt(stockQuantity) || 0,
      minStockLevel: minStockLevel ? parseInt(minStockLevel) : undefined,
      taxRate: taxRate ? parseFloat(taxRate) : undefined,
      status,
      imageUrl,
      barcode,
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    )
  }
}