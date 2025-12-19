import { NextRequest, NextResponse } from 'next/server'
import { InventoryService } from '@/lib/services/inventoryService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'inventory.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || undefined
    const category = searchParams.get('category') || undefined
    const subcategory = searchParams.get('subcategory') || undefined
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined
    const lowStock = searchParams.get('lowStock') === 'true'
    const outOfStock = searchParams.get('outOfStock') === 'true'
    const vendorId = searchParams.get('vendorId') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await InventoryService.getProducts({
      branchId,
      category,
      subcategory,
      status: status as any,
      search,
      lowStock,
      outOfStock,
      vendorId,
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'inventory.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      branchId,
      name,
      description,
      category,
      subcategory,
      sku,
      barcode,
      brand,
      costPrice,
      sellingPrice,
      mrp,
      taxRate,
      stockQuantity,
      minStockLevel,
      maxStockLevel,
      reorderPoint,
      unit,
      weight,
      dimensions,
      imageUrl,
      images,
      vendorId,
      vendorName,
      vendorSku,
    } = body

    // Validate required fields
    if (!branchId || !name || !category || !sku || !sellingPrice) {
      return NextResponse.json(
        { error: 'Branch ID, name, category, SKU, and selling price are required' },
        { status: 400 }
      )
    }

    // Generate SKU if not provided
    const finalSku = sku || InventoryService.generateSKU(category, branchId)

    const product = await InventoryService.createProduct({
      branchId,
      name,
      description,
      category,
      subcategory,
      sku: finalSku,
      barcode,
      brand,
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      sellingPrice: parseFloat(sellingPrice),
      mrp: mrp ? parseFloat(mrp) : undefined,
      taxRate: taxRate ? parseFloat(taxRate) : undefined,
      stockQuantity: stockQuantity ? parseInt(stockQuantity) : undefined,
      minStockLevel: minStockLevel ? parseInt(minStockLevel) : undefined,
      maxStockLevel: maxStockLevel ? parseInt(maxStockLevel) : undefined,
      reorderPoint: reorderPoint ? parseInt(reorderPoint) : undefined,
      unit,
      weight: weight ? parseFloat(weight) : undefined,
      dimensions,
      imageUrl,
      images,
      vendorId,
      vendorName,
      vendorSku,
    }, tenantId)

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    )
  }
}