'use client'

import { useEffect, useState } from 'react'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import { 
  getAdminDashboardMetrics, 
  getAllBranches, 
  getAllUsers, 
  getBranchStats,
  getRecentActivity,
  getLeadPipelineMetrics,
  getMemberGrowthData,
  getSalesAnalytics,
} from '@/app/actions/dashboards/admin'
import { toast } from 'react-toastify'

interface Metrics {
  totalBranches: number
  totalMembers: number
  totalStaff: number
  activeMembers: number
  monthlyRevenue: number
}

interface Branch {
  id: string
  name: string
  code: string
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  isActive: boolean
  memberCount: number
  staffCount: number
  classCount: number
}

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  isActive: boolean
  roles: string[]
}

interface BranchStat {
  branchId: string
  branchName: string
  memberCount: number
  revenue: number
}

interface LeadMetrics {
  funnel: {
    new: number
    contacted: number
    qualified: number
    proposal: number
    negotiation: number
    won: number
    lost: number
  }
  totalLeads: number
  convertedLeads: number
  newLeadsThisMonth: number
  conversionRate: number
}

interface SalesData {
  membershipRevenue: number
  membershipCount: number
  productRevenue: number
  productCount: number
  totalTransactions: number
  recentTransactions: Array<{
    id: string
    amount: number
    type: string
    paymentMethod: string
    memberName: string
    branch: string
    date: Date
  }>
  paymentBreakdown: Array<{
    method: string
    amount: number
    count: number
  }>
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [branchStats, setBranchStats] = useState<BranchStat[]>([])
  const [recentActivity, setRecentActivity] = useState<any>(null)
  const [leadMetrics, setLeadMetrics] = useState<LeadMetrics | null>(null)
  const [memberGrowth, setMemberGrowth] = useState<any[]>([])
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [metricsData, branchesData, usersData, statsData, activityData, leadData, growthData, salesInfo] = await Promise.all([
        getAdminDashboardMetrics(),
        getAllBranches(),
        getAllUsers(),
        getBranchStats(),
        getRecentActivity(),
        getLeadPipelineMetrics(),
        getMemberGrowthData(),
        getSalesAnalytics(),
      ])

      setMetrics(metricsData)
      setBranches(branchesData)
      setUsers(usersData)
      setBranchStats(statsData)
      setRecentActivity(activityData)
      setLeadMetrics(leadData)
      setMemberGrowth(growthData)
      setSalesData(salesInfo)
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  const funnelStages = leadMetrics ? [
    { label: 'New', value: leadMetrics.funnel.new, color: 'info.main' },
    { label: 'Contacted', value: leadMetrics.funnel.contacted, color: 'primary.main' },
    { label: 'Qualified', value: leadMetrics.funnel.qualified, color: 'secondary.main' },
    { label: 'Proposal', value: leadMetrics.funnel.proposal, color: 'warning.main' },
    { label: 'Won', value: leadMetrics.funnel.won, color: 'success.main' },
    { label: 'Lost', value: leadMetrics.funnel.lost, color: 'error.main' },
  ] : []

  const maxFunnel = Math.max(...funnelStages.map(s => s.value), 1)

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Typography variant="h4" fontWeight="bold">
          Admin Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tenant-wide overview and management
        </Typography>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                <i className="ri-building-line" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">{metrics?.totalBranches || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Total Branches</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
                <i className="ri-group-line" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">{metrics?.totalMembers || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Total Members</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'info.main', width: 48, height: 48 }}>
                <i className="ri-user-star-line" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">{metrics?.activeMembers || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Active Members</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
                <i className="ri-team-line" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">{metrics?.totalStaff || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Total Staff</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'error.main', width: 48, height: 48 }}>
                <i className="ri-money-rupee-circle-line" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  ₹{(metrics?.monthlyRevenue || 0).toLocaleString('en-IN')}
                </Typography>
                <Typography variant="body2" color="text.secondary">Monthly Revenue</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={12}>
        <Divider><Chip label="CRM & Analytics" /></Divider>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'info.main', width: 48, height: 48 }}>
                <i className="ri-user-follow-line" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">{leadMetrics?.totalLeads || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Total Leads</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
                <i className="ri-user-add-line" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">{leadMetrics?.newLeadsThisMonth || 0}</Typography>
                <Typography variant="body2" color="text.secondary">New This Month</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
                <i className="ri-medal-line" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">{leadMetrics?.convertedLeads || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Converted</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                <i className="ri-percent-line" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">{leadMetrics?.conversionRate || 0}%</Typography>
                <Typography variant="body2" color="text.secondary">Conversion Rate</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title="Lead Funnel" subheader="Pipeline stages breakdown" />
          <Divider />
          <CardContent>
            {funnelStages.length === 0 || leadMetrics?.totalLeads === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                No leads in the pipeline yet
              </Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                {funnelStages.map((stage) => (
                  <Box key={stage.label}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" fontWeight="medium">{stage.label}</Typography>
                      <Typography variant="body2" fontWeight="bold">{stage.value}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(stage.value / maxFunnel) * 100}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': { bgcolor: stage.color }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title="Member Growth" subheader="Last 6 months" />
          <Divider />
          <CardContent>
            {memberGrowth.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                No growth data available
              </Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={3}>
                {memberGrowth.map((month) => (
                  <Box key={month.month}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" fontWeight="medium">{month.month}</Typography>
                      <Box display="flex" gap={2}>
                        <Chip 
                          size="small" 
                          label={`+${month.newMembers} new`} 
                          color="success" 
                          variant="outlined" 
                        />
                        <Typography variant="body2" color="text.secondary">
                          Total: {month.totalMembers}
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, (month.totalMembers / Math.max(...memberGrowth.map(m => m.totalMembers), 1)) * 100)}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={12}>
        <Divider><Chip label="Sales & Revenue" /></Divider>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                <i className="ri-vip-crown-line" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  ₹{(salesData?.membershipRevenue || 0).toLocaleString('en-IN')}
                </Typography>
                <Typography variant="body2" color="text.secondary">Membership Revenue</Typography>
                <Typography variant="caption" color="text.secondary">
                  {salesData?.membershipCount || 0} memberships
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
                <i className="ri-shopping-bag-line" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  ₹{(salesData?.productRevenue || 0).toLocaleString('en-IN')}
                </Typography>
                <Typography variant="body2" color="text.secondary">Product Sales</Typography>
                <Typography variant="caption" color="text.secondary">
                  {salesData?.productCount || 0} orders
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
                <i className="ri-exchange-funds-line" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">{salesData?.totalTransactions || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Transactions</Typography>
                <Typography variant="caption" color="text.secondary">Last 30 days</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'info.main', width: 48, height: 48 }}>
                <i className="ri-bank-card-line" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {salesData?.paymentBreakdown?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">Payment Methods</Typography>
                <Typography variant="caption" color="text.secondary">Active</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardHeader title="Recent Transactions" subheader="Last 10 transactions" />
          <Divider />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!salesData?.recentTransactions?.length ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary" py={4}>
                        No transactions found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  salesData.recentTransactions.map((t) => (
                    <TableRow key={t.id} hover>
                      <TableCell>{t.memberName}</TableCell>
                      <TableCell>
                        <Chip 
                          label={t.type} 
                          size="small" 
                          color={t.type === 'MEMBERSHIP' ? 'primary' : 'secondary'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{t.branch}</TableCell>
                      <TableCell>{t.paymentMethod}</TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold" color="success.main">
                          ₹{t.amount.toLocaleString('en-IN')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title="Payment Methods" subheader="Revenue breakdown (30 days)" />
          <Divider />
          <CardContent>
            {!salesData?.paymentBreakdown?.length ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                No payment data available
              </Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                {salesData.paymentBreakdown.map((pm) => (
                  <Box key={pm.method}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" fontWeight="medium">{pm.method || 'Other'}</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        ₹{pm.amount.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {pm.count} transactions
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={12}>
        <Divider><Chip label="Branches & Users" /></Divider>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardHeader 
            title="All Branches" 
            action={
              <Button variant="contained" size="small" startIcon={<i className="ri-add-line" />}>
                Add Branch
              </Button>
            }
          />
          <Divider />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Branch</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="center">Members</TableCell>
                  <TableCell align="center">Staff</TableCell>
                  <TableCell align="center">Classes</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {branches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary" py={4}>
                        No branches found. Create your first branch to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  branches.map((branch) => (
                    <TableRow key={branch.id} hover>
                      <TableCell>
                        <Box>
                          <Typography fontWeight="medium">{branch.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{branch.code}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{branch.city || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell align="center">{branch.memberCount}</TableCell>
                      <TableCell align="center">{branch.staffCount}</TableCell>
                      <TableCell align="center">{branch.classCount}</TableCell>
                      <TableCell>
                        <Chip 
                          label={branch.isActive ? 'Active' : 'Inactive'} 
                          color={branch.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title="Branch Performance" />
          <Divider />
          <CardContent>
            {branchStats.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                No branch data available
              </Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={3}>
                {branchStats.map((stat) => (
                  <Box key={stat.branchId}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography fontWeight="medium">{stat.branchName}</Typography>
                      <Typography color="success.main" fontWeight="bold">
                        ₹{stat.revenue.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {stat.memberCount} members
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader 
            title="Users & Roles" 
            action={
              <Button variant="outlined" size="small" startIcon={<i className="ri-user-add-line" />}>
                Add User
              </Button>
            }
          />
          <Divider />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography color="text.secondary" py={4}>
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.slice(0, 8).map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar src={user.image || undefined} sx={{ width: 32, height: 32 }}>
                            {user.name?.charAt(0) || user.email.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {user.name || 'Unnamed'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {user.roles.map((role) => (
                            <Chip key={role} label={role} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.isActive ? 'Active' : 'Inactive'} 
                          color={user.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title="Recent Activity" />
          <Divider />
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" mb={2}>
              New Members
            </Typography>
            {recentActivity?.recentMembers?.length === 0 ? (
              <Typography color="text.secondary" variant="body2" mb={3}>
                No recent members
              </Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={2} mb={3}>
                {recentActivity?.recentMembers?.slice(0, 3).map((member: any) => (
                  <Box key={member.id} display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                        {member.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">{member.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{member.branch}</Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(member.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="text.secondary" mb={2}>
              Recent Payments
            </Typography>
            {recentActivity?.recentPayments?.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No recent payments
              </Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                {recentActivity?.recentPayments?.slice(0, 3).map((payment: any) => (
                  <Box key={payment.id} display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2">{payment.memberName}</Typography>
                      <Typography variant="caption" color="text.secondary">{payment.branch}</Typography>
                    </Box>
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      ₹{payment.amount.toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
