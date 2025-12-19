export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

export type InventoryItem = {
  id: string
  name: string
  category: string
  sku: string
  currentStock: number
  minStock: number
  maxStock: number
  unit: string
  supplier: string
  lastRestocked?: string
  status: StockStatus
}

export const mockInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'Whey Protein 5kg',
    category: 'Supplements',
    sku: 'SUP-WP-5K',
    currentStock: 45,
    minStock: 10,
    maxStock: 100,
    unit: 'units',
    supplier: 'NutriCo',
    lastRestocked: '2024-11-10',
    status: 'IN_STOCK'
  },
  {
    id: '2',
    name: 'Yoga Mat Premium',
    category: 'Equipment',
    sku: 'EQP-YM-PR',
    currentStock: 8,
    minStock: 15,
    maxStock: 50,
    unit: 'units',
    supplier: 'FitGear Inc',
    lastRestocked: '2024-10-20',
    status: 'LOW_STOCK'
  },
  {
    id: '3',
    name: 'Resistance Bands Set',
    category: 'Equipment',
    sku: 'EQP-RB-SET',
    currentStock: 0,
    minStock: 10,
    maxStock: 30,
    unit: 'sets',
    supplier: 'FitGear Inc',
    status: 'OUT_OF_STOCK'
  },
  {
    id: '4',
    name: 'Gym Towels',
    category: 'Supplies',
    sku: 'SUP-TWL',
    currentStock: 150,
    minStock: 50,
    maxStock: 200,
    unit: 'units',
    supplier: 'TextilePro',
    lastRestocked: '2024-11-15',
    status: 'IN_STOCK'
  }
]
