'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { Icon as IconifyIcon } from '@iconify/react';

// Styled Components
const LoginIllustration = styled('img')(({ theme }) => ({
  height: '100%',
  maxHeight: '100vh',
  [theme.breakpoints.down('lg')]: {
    maxHeight: 450
  }
}));

const RightWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  [theme.breakpoints.up('md')]: {
    maxWidth: 450
  }
}));

// Form Validation Schema
const schema = yup.object().shape({
  email: yup.string().email('Must be a valid email').required('Email is required'),
  password: yup.string().required('Password is required')
});

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: 'admin@vuexy.com',
      password: 'admin'
    }
  });

  const onSubmit = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false
    });

    if (res && res.ok && res.error === null) {
      const redirectURL = searchParams?.get('redirectTo') ?? '/en/dashboards/crm';
      router.replace(redirectURL);
    } else {
      setError(res?.error || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <Box className='flex h-screen'>
      {/* Left Side - Illustration */}
      <Box className='hidden md:flex md:w-1/2 lg:w-2/3 bg-primary-50 dark:bg-backgroundPaper'>
        <LoginIllustration
          alt='login-illustration'
          src='/images/pages/auth-v2-login-illustration-light.png'
          className='w-full h-full object-cover'
        />
      </Box>

      {/* Right Side - Login Form */}
      <RightWrapper className='flex items-center justify-center p-6 md:p-12'>
        <Box className='w-full max-w-md'>
          <Box className='mb-8 text-center'>
            <Typography variant='h4' className='mb-2' sx={{ fontWeight: 600 }}>
              Welcome to Gym Management! 👋
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Please sign-in to your account and start the adventure
            </Typography>
          </Box>

          {error && (
            <Box className='mb-6' sx={{ '& .MuiAlert-root': { py: 2 } }}>
              <div className='flex items-center p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400' role='alert'>
                <IconifyIcon icon='tabler:alert-circle' className='mr-2' />
                <span>{error}</span>
              </div>
            </Box>
          )}

          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
            <Box className='space-y-5'>
              <Controller
                name='email'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextField
                    autoFocus
                    fullWidth
                    label='Email'
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    placeholder='admin@example.com'
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                    className='w-full'
                  />
                )}
              />

              <Controller
                name='password'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextField
                    fullWidth
                    label='Password'
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    id='auth-login-password'
                    type={showPassword ? 'text' : 'password'}
                    error={Boolean(errors.password)}
                    helperText={errors.password?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            <IconifyIcon icon={showPassword ? 'tabler:eye-off' : 'tabler:eye'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />

              <Box className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    id='remember-me'
                    className='h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500'
                  />
                  <label htmlFor='remember-me' className='ml-2 block text-sm text-gray-900 dark:text-gray-100'>
                    Remember me
                  </label>
                </div>
                <a
                  href='/auth/forgot-password'
                  className='text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300'
                >
                  Forgot password?
                </a>
              </Box>

              <Button
                fullWidth
                size='large'
                type='submit'
                variant='contained'
                disabled={loading}
                className='h-11'
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </Box>
          </form>

          <Box className='mt-6 text-center'>
            <Typography variant='body2' className='text-gray-600 dark:text-gray-400'>
              New on our platform?{' '}
              <a
                href='/auth/register'
                className='font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300'
              >
                Create an account
              </a>
            </Typography>
          </Box>
        </Box>
      </RightWrapper>
    </Box>
  );
};

export default LoginPage;
