'use client'

import { useRef, useState } from 'react'
import type { MouseEvent } from 'react'

import { styled } from '@mui/material/styles'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'

import { Icon } from '@iconify/react'

import { useBranch } from '@/contexts/BranchContext'
import { useSettings } from '@core/hooks/useSettings'

const BranchDropdown = () => {
  const [open, setOpen] = useState(false)

  const anchorRef = useRef<HTMLButtonElement>(null)

  const { currentBranch, branches, setCurrentBranch, isLoading } = useBranch()
  const { settings } = useSettings()

  const handleDropdownOpen = () => {
    setOpen(prev => !prev)
  }

  const handleDropdownClose = (event?: MouseEvent<HTMLLIElement> | (MouseEvent | TouchEvent)) => {
    if (anchorRef.current && anchorRef.current.contains(event?.target as HTMLElement)) {
      return
    }

    setOpen(false)
  }

  const handleBranchSelect = (branchId: string) => {
    const selectedBranch = branches.find(b => b.id === branchId)
    
    if (selectedBranch) {
      setCurrentBranch(selectedBranch)
      setOpen(false)
    }
  }

  if (isLoading) {
    return (
      <IconButton size='small' className='mis-2'>
        <CircularProgress size={20} />
      </IconButton>
    )
  }

  if (!currentBranch) {
    return null
  }

  return (
    <>
      <Button
        ref={anchorRef}
        variant='outlined'
        size='small'
        onClick={handleDropdownOpen}
        startIcon={<Icon icon='tabler-building' />}
        className='mis-2 capitalize'
        sx={{
          borderColor: 'divider',
          color: 'text.primary',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover'
          }
        }}
      >
        {currentBranch.name}
      </Button>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='min-is-[240px] !mbs-3 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top'
            }}
          >
            <Paper className={settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg'}>
              <ClickAwayListener onClickAway={e => handleDropdownClose(e as MouseEvent | TouchEvent)}>
                <MenuList>
                  <div className='flex items-center plb-2 pli-6 gap-2' tabIndex={-1}>
                    <Icon icon='tabler-building' fontSize={24} />
                    <div className='flex items-start flex-col'>
                      <Typography className='font-medium' color='text.primary'>
                        Select Branch
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {branches.length} {branches.length === 1 ? 'branch' : 'branches'} available
                      </Typography>
                    </div>
                  </div>
                  <Divider className='mlb-1' />
                  {branches.map(branch => (
                    <MenuItem
                      key={branch.id}
                      selected={branch.id === currentBranch.id}
                      onClick={() => handleBranchSelect(branch.id)}
                      className='gap-3 pli-6'
                    >
                      <div className='flex items-center justify-between is-full gap-2'>
                        <div className='flex flex-col'>
                          <Typography className='font-medium' color='text.primary'>
                            {branch.name}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {branch.code} {branch.country ? `• ${branch.country}` : ''}
                          </Typography>
                        </div>
                        {branch.id === currentBranch.id && (
                          <Chip label='Active' size='small' color='primary' variant='tonal' />
                        )}
                      </div>
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default BranchDropdown
