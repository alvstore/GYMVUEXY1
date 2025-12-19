'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { getBranches, createBranch } from '@/app/actions/branches'

export type Branch = {
  id: string
  tenantId: string
  code: string
  name: string
  country: string | null
  currency: string
  timezone: string
}

type BranchContextType = {
  currentBranch: Branch | null
  branches: Branch[]
  setCurrentBranch: (branch: Branch) => void
  isLoading: boolean
  error: string | null
  refreshBranches: () => Promise<void>
}

const BranchContext = createContext<BranchContextType | undefined>(undefined)

export const BranchProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession()
  const [currentBranch, setCurrentBranchState] = useState<Branch | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBranches = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const data = await getBranches()
      const branchList = data && Array.isArray(data.branches) ? data.branches : []

      if (branchList.length === 0) {
        try {
          const newBranch = await createBranch({
            code: 'MAIN',
            name: 'Main Branch',
            country: null,
            currency: 'INR',
            timezone: 'Asia/Kolkata'
          })
          
          setBranches([newBranch])
          setCurrentBranchState(newBranch)
          if (typeof window !== 'undefined') {
            localStorage.setItem('selectedBranchId', newBranch.id)
          }
        } catch (createError: any) {
          console.warn('Could not create default branch:', createError.message)
          setError(createError.message || 'Failed to create default branch')
        }
      } else {
        setBranches(branchList)
        
        if (typeof window !== 'undefined') {
          const savedBranchId = localStorage.getItem('selectedBranchId')
          const savedBranch = branchList.find((b: Branch) => b.id === savedBranchId)
          
          if (savedBranch) {
            setCurrentBranchState(savedBranch)
          } else {
            setCurrentBranchState(branchList[0])
            localStorage.setItem('selectedBranchId', branchList[0].id)
          }
        } else {
          setCurrentBranchState(branchList[0])
        }
      }
    } catch (err) {
      console.error('Error fetching branches:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setBranches([])
    } finally {
      setIsLoading(false)
    }
  }, [status, session?.user])

  useEffect(() => {
    fetchBranches()
  }, [fetchBranches])

  const setCurrentBranch = (branch: Branch) => {
    setCurrentBranchState(branch)
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedBranchId', branch.id)
    }
  }

  const refreshBranches = async () => {
    await fetchBranches()
  }

  return (
    <BranchContext.Provider
      value={{
        currentBranch,
        branches,
        setCurrentBranch,
        isLoading,
        error,
        refreshBranches
      }}
    >
      {children}
    </BranchContext.Provider>
  )
}

export const useBranch = () => {
  const context = useContext(BranchContext)
  
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider')
  }
  
  return context
}
