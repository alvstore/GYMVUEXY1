'use client';

import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  FitnessCenter,
  Schedule,
  TrendingUp,
  Payment,
  PlayCircleOutline,
  CheckCircle,
  Restaurant,
  DirectionsRun,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const workoutProgress = [
  { day: 'Mon', calories: 320 },
  { day: 'Tue', calories: 280 },
  { day: 'Wed', calories: 450 },
  { day: 'Thu', calories: 380 },
  { day: 'Fri', calories: 520 },
  { day: 'Sat', calories: 410 },
  { day: 'Sun', calories: 290 },
];

const upcomingClasses = [
  { date: '2024-01-20', time: '09:00', class: 'Morning Yoga', instructor: 'Sarah Johnson', status: 'booked' },
  { date: '2024-01-22', time: '18:00', class: 'HIIT Training', instructor: 'Mike Chen', status: 'booked' },
  { date: '2024-01-24', time: '14:00', class: 'Pilates', instructor: 'Emily Davis', status: 'available' },
  { date: '2024-01-26', time: '10:30', class: 'CrossFit', instructor: 'David Wilson', status: 'waitlist' },
];

const workoutPlan = [
  { exercise: 'Push-ups', sets: 3, reps: '12-15', completed: true },
  { exercise: 'Squats', sets: 4, reps: '15-20', completed: true },
  { exercise: 'Plank', sets: 3, reps: '30-60s', completed: false },
  { exercise: 'Lunges', sets: 3, reps: '12 each', completed: false },
  { exercise: 'Burpees', sets: 3, reps: '8-12', completed: false },
];

const MemberDashboard = () => {
  const completedWorkouts = workoutPlan.filter(w => w.completed).length;
  const totalWorkouts = workoutPlan.length;
  const progressPercentage = (completedWorkouts / totalWorkouts) * 100;

  return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Welcome back, Sarah!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Let's continue your fitness journey
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<PlayCircleOutline />}>
            Start Workout
          </Button>
        </Box>

        {/* Progress Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2, width: 56, height: 56 }}>
                  <FitnessCenter />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  23
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Workouts This Month
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={76} 
                  sx={{ mt: 2, height: 6, borderRadius: 3 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto', mb: 2, width: 56, height: 56 }}>
                  <DirectionsRun />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  8.2K
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Calories Burned
                </Typography>
                <Typography variant="body2" color="success.main" sx={{ mt: 1, fontWeight: 600 }}>
                  +12% from last week
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2, width: 56, height: 56 }}>
                  <Schedule />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  4
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Classes Booked
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Next: Tomorrow 9:00 AM
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'error.main', mx: 'auto', mb: 2, width: 56, height: 56 }}>
                  <TrendingUp />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  87%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Goal Achievement
                </Typography>
                <Typography variant="body2" color="success.main" sx={{ mt: 1, fontWeight: 600 }}>
                  Great progress!
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Weekly Progress */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Weekly Calorie Burn
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={workoutProgress}>
                      <XAxis dataKey="day" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Line 
                        type="monotone" 
                        dataKey="calories" 
                        stroke="#FFD600" 
                        strokeWidth={3}
                        dot={{ fill: '#FFD600', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Today's Workout Plan */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Today's Workout
                  </Typography>
                  <Chip 
                    label={`${completedWorkouts}/${totalWorkouts}`} 
                    color="primary" 
                    size="small"
                  />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progressPercentage} 
                  sx={{ mb: 3, height: 8, borderRadius: 4 }}
                />
                <List sx={{ p: 0 }}>
                  {workoutPlan.map((exercise, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        {exercise.completed ? (
                          <CheckCircle color="success" />
                        ) : (
                          <FitnessCenter color="action" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={exercise.exercise}
                        secondary={`${exercise.sets} sets × ${exercise.reps}`}
                        sx={{
                          '& .MuiListItemText-primary': {
                            textDecoration: exercise.completed ? 'line-through' : 'none',
                            color: exercise.completed ? 'text.secondary' : 'text.primary',
                          },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
                <Button variant="contained" fullWidth sx={{ mt: 2 }}>
                  Continue Workout
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Upcoming Classes */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Upcoming Classes
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date & Time</TableCell>
                        <TableCell>Class</TableCell>
                        <TableCell>Instructor</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {upcomingClasses.map((classItem, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(classItem.date).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {classItem.time}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">{classItem.class}</Typography>
                          </TableCell>
                          <TableCell>{classItem.instructor}</TableCell>
                          <TableCell>
                            <Chip
                              label={classItem.status}
                              color={
                                classItem.status === 'booked' ? 'success' :
                                classItem.status === 'waitlist' ? 'warning' : 'default'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {classItem.status === 'available' ? (
                              <Button variant="outlined" size="small">
                                Book
                              </Button>
                            ) : classItem.status === 'booked' ? (
                              <Button variant="outlined" size="small" color="error">
                                Cancel
                              </Button>
                            ) : (
                              <Button variant="outlined" size="small" disabled>
                                Waitlisted
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
  );
};

export default MemberDashboard;