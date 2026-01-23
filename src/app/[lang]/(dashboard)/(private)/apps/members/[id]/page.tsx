'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getMemberProfile } from '@/app/actions/members'
import MemberProfile from '@/views/apps/members/profile/MemberProfile'
import { toast } from 'react-toastify'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const MemberProfilePage = () => {
  const params = useParams()
  const memberId = params.id as string
  const [member, setMember] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadMember = async () => {
    try {
      setIsLoading(true)
      const data = await getMemberProfile(memberId)
      setMember(data)
    } catch (error: any) {
      console.error('Error loading member:', error)
      toast.error(error.message || 'Failed to load member profile')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (memberId) {
      loadMember()
    }
  }, [memberId])

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (!member) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="text.secondary">
          Member not found
        </Typography>
      </Box>
    )
  }

  return <MemberProfile member={member} onRefresh={loadMember} />
}

export default MemberProfilePage
