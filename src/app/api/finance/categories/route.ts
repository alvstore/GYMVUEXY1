import { NextResponse } from 'next/server'
import { getCategories } from '@/app/actions/finance'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryType = searchParams.get('categoryType') as 'INCOME' | 'EXPENSE' | null
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const categories = await getCategories({
      categoryType: categoryType || undefined,
      includeInactive,
    })

    return NextResponse.json(categories)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
