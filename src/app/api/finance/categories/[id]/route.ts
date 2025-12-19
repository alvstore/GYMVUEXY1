import { NextResponse } from 'next/server'
import { updateCategory } from '@/app/actions/finance'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const category = await updateCategory(params.id, body)
    return NextResponse.json(category)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
