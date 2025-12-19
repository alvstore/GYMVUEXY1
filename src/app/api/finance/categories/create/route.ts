import { NextResponse } from 'next/server'
import { createCategory } from '@/app/actions/finance'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const category = await createCategory(body)
    return NextResponse.json(category)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
