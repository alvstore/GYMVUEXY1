'use client'

import { useState, useEffect } from 'react'
import ClassListTable from "@/views/apps/classes/list/ClassListTable"
import { getClasses } from '@/app/actions/classes'
import type { GymClass } from '@/types/apps/classTypes'
import { toast } from 'react-toastify'

const ClassesPage = () => {
  const [classData, setClassData] = useState<GymClass[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadClasses = async () => {
    try {
      setIsLoading(true)
      const classes = await getClasses({ isActive: true })
      setClassData(classes)
    } catch (error) {
      console.error('Error loading classes:', error)
      toast.error('Failed to load classes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClasses()
  }, [])

  return <ClassListTable classData={classData} onRefresh={loadClasses} />
}

export default ClassesPage
