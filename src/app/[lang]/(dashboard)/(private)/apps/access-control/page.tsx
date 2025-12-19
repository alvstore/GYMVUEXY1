'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Switch,
  FormControlLabel,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Room,
  Security,
  DeviceHub,
  Warning,
  CheckCircle,
  Block,
  AccessTime,
  Wifi,
  WifiOff,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

interface Room {
  id: string;
  name: string;
  code: string;
  roomType: string;
  capacity?: number;
  isActive: boolean;
  deviceCount: number;
  currentOccupancy: number;
}

interface AccessDevice {
  id: string;
  name: string;
  deviceId: string;
  deviceType: string;
  roomName: string;
  ipAddress?: string;
  isOnline: boolean;
  lastPing?: string;
  isActive: boolean;
}

interface RoomPermission {
  id: string;
  roomName: string;
  planName?: string;
  userName?: string;
  accessLevel: string;
  timeRestrictions?: any;
  isActive: boolean;
}

const mockRooms: Room[] = [
  {
    id: '1',
    name: 'Main Gym Floor',
    code: 'GYM-01',
    roomType: 'GYM_FLOOR',
    capacity: 50,
    isActive: true,
    deviceCount: 3,
    currentOccupancy: 45,
  },
  {
    id: '2',
    name: 'Yoga Studio',
    code: 'YOGA-01',
    roomType: 'YOGA_STUDIO',
    capacity: 20,
    isActive: true,
    deviceCount: 2,
    currentOccupancy: 8,
  },
  {
    id: '3',
    name: 'Pool Area',
    code: 'POOL-01',
    roomType: 'POOL',
    capacity: 30,
    isActive: true,
    deviceCount: 2,
    currentOccupancy: 12,
  },
];

const mockDevices: AccessDevice[] = [
  {
    id: '1',
    name: 'Main Entrance RFID',
    deviceId: 'RFID-001',
    deviceType: 'RFID_READER',
    roomName: 'Main Gym Floor',
    ipAddress: '192.168.1.101',
    isOnline: true,
    lastPing: '2024-01-20T12:00:00Z',
    isActive: true,
  },
  {
    id: '2',
    name: 'Yoga Studio Biometric',
    deviceId: 'BIO-002',
    deviceType: 'BIOMETRIC_SCANNER',
    roomName: 'Yoga Studio',
    ipAddress: '192.168.1.102',
    isOnline: false,
    lastPing: '2024-01-20T10:30:00Z',
    isActive: true,
  },
  {
    id: '3',
    name: 'Pool QR Scanner',
    deviceId: 'QR-003',
    deviceType: 'QR_SCANNER',
    roomName: 'Pool Area',
    ipAddress: '192.168.1.103',
    isOnline: true,
    lastPing: '2024-01-20T11:55:00Z',
    isActive: true,
  },
];

const mockPermissions: RoomPermission[] = [
  {
    id: '1',
    roomName: 'Main Gym Floor',
    planName: 'Basic Plan',
    accessLevel: 'BASIC',
    isActive: true,
  },
  {
    id: '2',
    roomName: 'Pool Area',
    planName: 'Premium Plan',
    accessLevel: 'BASIC',
    isActive: true,
  },
  {
    id: '3',
    roomName: 'Yoga Studio',
    userName: 'John Trainer',
    accessLevel: 'FULL',
    timeRestrictions: { days: ['monday', 'wednesday', 'friday'], startTime: '09:00', endTime: '17:00' },
    isActive: true,
  },
];

const AccessControlPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [devices, setDevices] = useState<AccessDevice[]>(mockDevices);
  const [permissions, setPermissions] = useState<RoomPermission[]>(mockPermissions);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'room' | 'device' | 'permission'>('room');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleAddItem = (type: 'room' | 'device' | 'permission') => {
    setDialogType(type);
    setSelectedItem(null);
    setOpenDialog(true);
  };

  const handleEditItem = (type: 'room' | 'device' | 'permission', item: any) => {
    setDialogType(type);
    setSelectedItem(item);
    setOpenDialog(true);
  };

  const getDeviceTypeIcon = (type: string) => {
    switch (type) {
      case 'RFID_READER':
        return '📱';
      case 'BIOMETRIC_SCANNER':
        return '👆';
      case 'QR_SCANNER':
        return '📷';
      case 'FACIAL_RECOGNITION':
        return '👤';
      default:
        return '🔧';
    }
  };

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case 'GYM_FLOOR':
        return 'primary';
      case 'YOGA_STUDIO':
        return 'secondary';
      case 'POOL':
        return 'info';
      default:
        return 'default';
    }
  };

  const offlineDevices = devices.filter(d => !d.isOnline).length;
  const totalCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const currentOccupancy = rooms.reduce((sum, r) => sum + r.currentOccupancy, 0);
  const occupancyRate = Math.round((currentOccupancy / totalCapacity) * 100);

  return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Access Control Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<Room />} onClick={() => handleAddItem('room')}>
              Add Room
            </Button>
            <Button variant="outlined" startIcon={<DeviceHub />} onClick={() => handleAddItem('device')}>
              Add Device
            </Button>
            <Button variant="contained" startIcon={<Security />} onClick={() => handleAddItem('permission')}>
              Add Permission
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2, width: 56, height: 56 }}>
                  <Room />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {rooms.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Rooms
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2, width: 56, height: 56 }}>
                  <DeviceHub />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {devices.filter(d => d.isOnline).length}/{devices.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Devices Online
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2, width: 56, height: 56 }}>
                  <Security />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {currentOccupancy}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current Occupancy
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: offlineDevices > 0 ? 'error.main' : 'success.main', mx: 'auto', mb: 2, width: 56, height: 56 }}>
                  {offlineDevices > 0 ? <Warning /> : <CheckCircle />}
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {occupancyRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Capacity Utilization
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Alerts */}
        {offlineDevices > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {offlineDevices} access control devices are offline
            </Typography>
            <Typography variant="body2">
              Check device connectivity and ensure proper network configuration.
            </Typography>
          </Alert>
        )}

        {/* Rooms Management */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Room Management
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Room</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Current Occupancy</TableCell>
                    <TableCell>Devices</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            <Room />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {room.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {room.code}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={room.roomType.replace('_', ' ')}
                          color={getRoomTypeColor(room.roomType)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{room.capacity || 'N/A'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {room.currentOccupancy}
                          </Typography>
                          {room.capacity && (
                            <Typography variant="body2" color="text.secondary">
                              ({Math.round((room.currentOccupancy / room.capacity) * 100)}%)
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{room.deviceCount} devices</TableCell>
                      <TableCell>
                        <Chip
                          label={room.isActive ? 'Active' : 'Inactive'}
                          color={room.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEditItem('room', room)}>
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Access Devices */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Access Control Devices
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Device</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Ping</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ mr: 2, fontSize: '1.5rem' }}>
                            {getDeviceTypeIcon(device.deviceType)}
                          </Typography>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {device.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                              {device.deviceId}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {device.deviceType.replace('_', ' ')}
                        </Typography>
                      </TableCell>
                      <TableCell>{device.roomName}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {device.ipAddress || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {device.isOnline ? <Wifi color="success" /> : <WifiOff color="error" />}
                          <Chip
                            label={device.isOnline ? 'Online' : 'Offline'}
                            color={device.isOnline ? 'success' : 'error'}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {device.lastPing ? new Date(device.lastPing).toLocaleString() : 'Never'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEditItem('device', device)}>
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Room Permissions */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Room Access Permissions
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Room</TableCell>
                    <TableCell>Granted To</TableCell>
                    <TableCell>Access Level</TableCell>
                    <TableCell>Time Restrictions</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>{permission.roomName}</TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {permission.planName || permission.userName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {permission.planName ? 'Membership Plan' : 'Individual User'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={permission.accessLevel}
                          color={permission.accessLevel === 'FULL' ? 'success' : 'primary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {permission.timeRestrictions ? (
                          <Typography variant="body2" color="text.secondary">
                            {permission.timeRestrictions.days?.join(', ')} <br />
                            {permission.timeRestrictions.startTime} - {permission.timeRestrictions.endTime}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No restrictions
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={permission.isActive ? 'Active' : 'Inactive'}
                          color={permission.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEditItem('permission', permission)}>
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedItem ? 'Edit' : 'Add'} {dialogType === 'room' ? 'Room' : dialogType === 'device' ? 'Device' : 'Permission'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {dialogType === 'room' && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Room Name" defaultValue={selectedItem?.name || ''} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Room Code" defaultValue={selectedItem?.code || ''} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Room Type</InputLabel>
                      <Select defaultValue={selectedItem?.roomType || ''} label="Room Type">
                        <MenuItem value="GYM_FLOOR">Gym Floor</MenuItem>
                        <MenuItem value="CARDIO_AREA">Cardio Area</MenuItem>
                        <MenuItem value="WEIGHT_ROOM">Weight Room</MenuItem>
                        <MenuItem value="YOGA_STUDIO">Yoga Studio</MenuItem>
                        <MenuItem value="POOL">Pool</MenuItem>
                        <MenuItem value="SPA">Spa</MenuItem>
                        <MenuItem value="LOCKER_ROOM">Locker Room</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Capacity" type="number" defaultValue={selectedItem?.capacity || ''} />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch defaultChecked={selectedItem?.isActive ?? true} />}
                      label="Active"
                    />
                  </Grid>
                </>
              )}

              {dialogType === 'device' && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Device Name" defaultValue={selectedItem?.name || ''} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Device ID" defaultValue={selectedItem?.deviceId || ''} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Device Type</InputLabel>
                      <Select defaultValue={selectedItem?.deviceType || ''} label="Device Type">
                        <MenuItem value="RFID_READER">RFID Reader</MenuItem>
                        <MenuItem value="BIOMETRIC_SCANNER">Biometric Scanner</MenuItem>
                        <MenuItem value="QR_SCANNER">QR Scanner</MenuItem>
                        <MenuItem value="FACIAL_RECOGNITION">Facial Recognition</MenuItem>
                        <MenuItem value="MAGNETIC_LOCK">Magnetic Lock</MenuItem>
                        <MenuItem value="TURNSTILE">Turnstile</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Room</InputLabel>
                      <Select defaultValue={selectedItem?.roomName || ''} label="Room">
                        {rooms.map((room) => (
                          <MenuItem key={room.id} value={room.name}>
                            {room.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="IP Address" defaultValue={selectedItem?.ipAddress || ''} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={<Switch defaultChecked={selectedItem?.isActive ?? true} />}
                      label="Active"
                    />
                  </Grid>
                </>
              )}

              {dialogType === 'permission' && (
                <>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Room</InputLabel>
                      <Select defaultValue={selectedItem?.roomName || ''} label="Room">
                        {rooms.map((room) => (
                          <MenuItem key={room.id} value={room.name}>
                            {room.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Access Level</InputLabel>
                      <Select defaultValue={selectedItem?.accessLevel || 'BASIC'} label="Access Level">
                        <MenuItem value="BASIC">Basic</MenuItem>
                        <MenuItem value="EXTENDED">Extended</MenuItem>
                        <MenuItem value="FULL">Full (24/7)</MenuItem>
                        <MenuItem value="RESTRICTED">Restricted</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      Grant Access To:
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel>Membership Plan or User</InputLabel>
                      <Select label="Membership Plan or User">
                        <MenuItem value="basic-plan">Basic Plan</MenuItem>
                        <MenuItem value="premium-plan">Premium Plan</MenuItem>
                        <MenuItem value="vip-plan">VIP Plan</MenuItem>
                        <MenuItem value="john-trainer">John Trainer (Staff)</MenuItem>
                        <MenuItem value="jane-admin">Jane Admin (Admin)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch defaultChecked={selectedItem?.isActive ?? true} />}
                      label="Active"
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button variant="contained">
              {selectedItem ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

export default AccessControlPage;