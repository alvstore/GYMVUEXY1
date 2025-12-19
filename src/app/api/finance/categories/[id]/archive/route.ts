import { NextResponse } from 'next/server'
import { archiveCategory } from '@/app/actions/finance'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await archiveCategory(params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
