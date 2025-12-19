import { NextRequest, NextResponse } from 'next/server'
import { scheduleClass, getClasses, cancelClass } from '@/app/actions/classes'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const isActive = searchParams.get('active')
    const trainerId = searchParams.get('trainerId')
    const classType = searchParams.get('type')

    const classes = await getClasses({
      isActive: isActive === 'true',
      trainerId: trainerId || undefined,
      classType: classType || undefined
    })

    return NextResponse.json({ classes, total: classes.length })
  } catch (error) {
    console.error('Classes GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    if (data.action === 'schedule') {
      const result = await scheduleClass({
        name: data.name,
        classType: data.classType,
        trainerId: data.trainerId,
        startTime: data.startTime,
        endTime: data.endTime,
        capacity: data.capacity,
        difficulty: data.difficulty,
        description: data.description,
        roomId: data.roomId,
        branchId: data.branchId
      })
      return NextResponse.json(result)
    }

    if (data.action === 'cancel') {
      const result = await cancelClass(data.classId)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Classes POST error:', error)
    return NextResponse.json({ error: 'Failed to process class action' }, { status: 500 })
  }
}
