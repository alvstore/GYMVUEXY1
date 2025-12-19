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
import Paper from '@mui/material/Paper'
import Divider from '@mui/material/Divider'
import { Add, Phone, Email, Person, TrendingUp, Schedule, CheckCircle } from '@mui/icons-material'
import { getLeads, getLeadStats, createLead, updateLeadStage, addLeadActivity } from '@/app/actions/leads'
import { toast } from 'react-toastify'

const STAGES = [
  { key: 'NEW', label: 'New', color: '#7C3AED' },
  { key: 'CONTACTED', label: 'Contacted', color: '#2563EB' },
  { key: 'QUALIFIED', label: 'Qualified', color: '#0891B2' },
  { key: 'TOUR_SCHEDULED', label: 'Tour Scheduled', color: '#059669' },
  { key: 'PROPOSAL_SENT', label: 'Proposal Sent', color: '#D97706' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: '#DC2626' },
]

export default function LeadPipeline() {
  const [leads, setLeads] = useState<any>({ leads: [] })
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: 'WALK_IN',
    interestedIn: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [leadsData, statsData] = await Promise.all([
        getLeads({ limit: 100 }),
        getLeadStats(),
      ])
      setLeads(leadsData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await createLead(formData)
      toast.success('Lead created successfully')
      setOpenDialog(false)
      loadData()
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        source: 'WALK_IN',
        interestedIn: '',
        notes: '',
      })
    } catch (error) {
      toast.error('Failed to create lead')
    }
  }

  const handleStageChange = async (leadId: string, newStage: string) => {
    try {
      await updateLeadStage(leadId, newStage)
      toast.success('Lead moved to ' + newStage)
      loadData()
    } catch (error) {
      toast.error('Failed to update lead')
    }
  }

  const getLeadsByStage = (stage: string) => {
    return leads.leads?.filter((lead: any) => lead.stage === stage) || []
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
          <Typography variant="h4" gutterBottom>Lead Pipeline</Typography>
          <Typography color="textSecondary">
            Track and manage sales leads through your conversion funnel
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}>
          Add Lead
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2">Total Leads</Typography>
              <Typography variant="h4">{stats?.total || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2">New</Typography>
              <Typography variant="h4" color="primary.main">{stats?.newLeads || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2">Won</Typography>
              <Typography variant="h4" color="success.main">{stats?.won || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2">Lost</Typography>
              <Typography variant="h4" color="error.main">{stats?.lost || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2">Conversion</Typography>
              <Typography variant="h4">{stats?.conversionRate || 0}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2">Follow-ups Due</Typography>
              <Typography variant="h4" color="warning.main">{stats?.followUpsDue || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
        {STAGES.map((stage) => (
          <Paper
            key={stage.key}
            sx={{
              minWidth: 280,
              maxWidth: 280,
              bgcolor: 'background.default',
              borderTop: `4px solid ${stage.color}`,
            }}
          >
            <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography fontWeight="bold">{stage.label}</Typography>
                <Chip label={getLeadsByStage(stage.key).length} size="small" />
              </Box>
            </Box>
            <Box sx={{ p: 1, maxHeight: 500, overflowY: 'auto' }}>
              {getLeadsByStage(stage.key).map((lead: any) => (
                <Card key={lead.id} sx={{ mb: 1, cursor: 'pointer' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: stage.color }}>
                        {lead.firstName?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {lead.firstName} {lead.lastName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Score: {lead.score}
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {lead.phone && (
                        <Chip
                          icon={<Phone sx={{ fontSize: 14 }} />}
                          label={lead.phone}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      <Chip label={lead.source} size="small" variant="outlined" />
                    </Box>
                    {lead.interestedIn && (
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        Interested in: {lead.interestedIn}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        ))}
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Lead</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Source</InputLabel>
                <Select
                  value={formData.source}
                  label="Source"
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                >
                  <MenuItem value="WALK_IN">Walk-in</MenuItem>
                  <MenuItem value="REFERRAL">Referral</MenuItem>
                  <MenuItem value="WEBSITE">Website</MenuItem>
                  <MenuItem value="SOCIAL_MEDIA">Social Media</MenuItem>
                  <MenuItem value="GOOGLE_ADS">Google Ads</MenuItem>
                  <MenuItem value="FACEBOOK_ADS">Facebook Ads</MenuItem>
                  <MenuItem value="PHONE_INQUIRY">Phone Inquiry</MenuItem>
                  <MenuItem value="EMAIL">Email</MenuItem>
                  <MenuItem value="EVENT">Event</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Interested In"
                value={formData.interestedIn}
                onChange={(e) => setFormData({ ...formData, interestedIn: e.target.value })}
                placeholder="e.g., Monthly Membership, Personal Training"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Add Lead</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
