'use client'

import { useState, useEffect } from 'react'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { Add, Edit, Build, Warning, CheckCircle, Cancel } from '@mui/icons-material'
import { getEquipmentList, getEquipmentStats, createEquipment, updateEquipment, scheduleMaintenanceAction } from '@/app/actions/equipment'
import { toast } from 'react-toastify'

export default function EquipmentDashboard() {
  const [equipment, setEquipment] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openMaintenanceDialog, setOpenMaintenanceDialog] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'CARDIO',
    brand: '',
    model: '',
    serialNumber: '',
    location: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [equipmentData, statsData] = await Promise.all([
        getEquipmentList(),
        getEquipmentStats(),
      ])
      setEquipment(equipmentData)
      setStats(statsData)
    } catch (error) {
      toast.error('Failed to load equipment data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await createEquipment(formData as any)
      toast.success('Equipment added successfully')
      setOpenDialog(false)
      loadData()
      setFormData({ name: '', category: 'CARDIO', brand: '', model: '', serialNumber: '', location: '' })
    } catch (error) {
      toast.error('Failed to add equipment')
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateEquipment(id, { status: status as any })
      toast.success('Status updated')
      loadData()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPERATIONAL': return 'success'
      case 'UNDER_MAINTENANCE': return 'warning'
      case 'OUT_OF_ORDER': return 'error'
      case 'RETIRED': return 'default'
      default: return 'default'
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'EXCELLENT': return 'success'
      case 'GOOD': return 'info'
      case 'FAIR': return 'warning'
      case 'POOR': return 'error'
      case 'NEEDS_REPAIR': return 'error'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <Box>
          <Typography variant="h4" gutterBottom>Equipment Tracking</Typography>
          <Typography color="textSecondary">
            Manage gym equipment, maintenance schedules, and inventory
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}>
          Add Equipment
        </Button>
      </Box>

      <Grid container spacing={6} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box textAlign="center">
                <Typography color="textSecondary" variant="body2">Total</Typography>
                <Typography variant="h4">{stats?.total || 0}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box textAlign="center">
                <Typography color="textSecondary" variant="body2">Operational</Typography>
                <Typography variant="h4" color="success.main">{stats?.operational || 0}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box textAlign="center">
                <Typography color="textSecondary" variant="body2">Maintenance</Typography>
                <Typography variant="h4" color="warning.main">{stats?.underMaintenance || 0}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box textAlign="center">
                <Typography color="textSecondary" variant="body2">Out of Order</Typography>
                <Typography variant="h4" color="error.main">{stats?.outOfOrder || 0}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box textAlign="center">
                <Typography color="textSecondary" variant="body2">Needs Repair</Typography>
                <Typography variant="h4" color="error.main">{stats?.needsRepair || 0}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box textAlign="center">
                <Typography color="textSecondary" variant="body2">Due Soon</Typography>
                <Typography variant="h4" color="warning.main">{stats?.upcomingMaintenance || 0}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardHeader title="Equipment List" />
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Brand/Model</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Next Maintenance</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {equipment.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography fontWeight="bold">{item.name}</Typography>
                      {item.serialNumber && (
                        <Typography variant="caption" color="textSecondary">
                          SN: {item.serialNumber}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      {item.brand && <Typography variant="body2">{item.brand}</Typography>}
                      {item.model && <Typography variant="caption" color="textSecondary">{item.model}</Typography>}
                    </TableCell>
                    <TableCell>{item.location || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={item.condition} 
                        size="small" 
                        color={getConditionColor(item.condition) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.status} 
                        size="small" 
                        color={getStatusColor(item.status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      {item.nextMaintenance ? (
                        <Typography variant="body2">
                          {new Date(item.nextMaintenance).toLocaleDateString()}
                        </Typography>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setSelectedEquipment(item)
                          setOpenMaintenanceDialog(true)
                        }}
                      >
                        <Build />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Equipment</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <MenuItem value="CARDIO">Cardio</MenuItem>
                  <MenuItem value="STRENGTH">Strength</MenuItem>
                  <MenuItem value="FREE_WEIGHTS">Free Weights</MenuItem>
                  <MenuItem value="FUNCTIONAL">Functional</MenuItem>
                  <MenuItem value="STRETCHING">Stretching</MenuItem>
                  <MenuItem value="STUDIO">Studio</MenuItem>
                  <MenuItem value="ACCESSORIES">Accessories</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Serial Number"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Add Equipment</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
