'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import Divider from '@mui/material/Divider'

interface FacilitySidebarProps {
  mdAbove: boolean
  leftSidebarOpen: boolean
  handleLeftSidebarToggle: () => void
  facilities: any[]
  selectedFacilityIds: string[]
  setSelectedFacilityIds: (ids: string[]) => void
  facilityColors: Record<string, string>
  calendarApi: any
}

const FacilitySidebar = (props: FacilitySidebarProps) => {
  const {
    mdAbove,
    leftSidebarOpen,
    handleLeftSidebarToggle,
    facilities,
    selectedFacilityIds,
    setSelectedFacilityIds,
    facilityColors,
    calendarApi,
  } = props

  const handleSelectAll = () => {
    if (selectedFacilityIds.length === facilities.length) {
      setSelectedFacilityIds([])
    } else {
      setSelectedFacilityIds(facilities.map(f => f.id))
    }
  }

  const handleFacilityToggle = (facilityId: string) => {
    if (selectedFacilityIds.includes(facilityId)) {
      setSelectedFacilityIds(selectedFacilityIds.filter(id => id !== facilityId))
    } else {
      setSelectedFacilityIds([...selectedFacilityIds, facilityId])
    }
  }

  const SidebarContent = () => (
    <Box sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant='h6' sx={{ mb: 4 }}>
        Facility Calendar
      </Typography>
      
      <Button
        fullWidth
        variant='contained'
        sx={{ mb: 4 }}
        onClick={() => calendarApi?.today()}
      >
        Today
      </Button>

      <Divider sx={{ mb: 4 }} />
      
      <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 500 }}>
        Filter Facilities
      </Typography>
      
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedFacilityIds.length === facilities.length}
              indeterminate={selectedFacilityIds.length > 0 && selectedFacilityIds.length < facilities.length}
              onChange={handleSelectAll}
            />
          }
          label='View All'
        />
        
        {facilities.map((facility) => (
          <FormControlLabel
            key={facility.id}
            control={
              <Checkbox
                checked={selectedFacilityIds.includes(facility.id)}
                onChange={() => handleFacilityToggle(facility.id)}
                sx={{
                  color: facilityColors[facility.facilityType] || '#95A5A6',
                  '&.Mui-checked': {
                    color: facilityColors[facility.facilityType] || '#95A5A6',
                  },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: facilityColors[facility.facilityType] || '#95A5A6',
                  }}
                />
                <Typography variant='body2'>{facility.name}</Typography>
              </Box>
            }
          />
        ))}
      </FormGroup>
      
      <Box sx={{ mt: 'auto' }}>
        <Divider sx={{ my: 4 }} />
        <Typography variant='caption' color='text.secondary'>
          Click on a booking to view details, mark attendance, or cancel.
        </Typography>
      </Box>
    </Box>
  )

  if (mdAbove) {
    return (
      <Box
        sx={{
          width: 260,
          flexShrink: 0,
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <SidebarContent />
      </Box>
    )
  }

  return (
    <Drawer
      open={leftSidebarOpen}
      onClose={handleLeftSidebarToggle}
      variant='temporary'
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: 260 } }}
    >
      <SidebarContent />
    </Drawer>
  )
}

export default FacilitySidebar
