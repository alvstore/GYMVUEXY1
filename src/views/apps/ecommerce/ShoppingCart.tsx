'use client'

import { useState, useEffect } from 'react'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { Add, Remove, Delete, ShoppingCart as CartIcon } from '@mui/icons-material'
import { getActiveCart, updateCartItem, removeFromCart, createCheckoutSession } from '@/app/actions/ecommerce'
import { toast } from 'react-toastify'

interface CartProps {
  memberId: string
}

export default function ShoppingCart({ memberId }: CartProps) {
  const [cart, setCart] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    loadCart()
  }, [memberId])

  const loadCart = async () => {
    try {
      const data = await getActiveCart(memberId)
      setCart(data)
    } catch (error) {
      console.error('Failed to load cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      await updateCartItem(itemId, newQuantity)
      loadCart()
    } catch (error) {
      toast.error('Failed to update cart')
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeFromCart(itemId)
      loadCart()
      toast.success('Item removed from cart')
    } catch (error) {
      toast.error('Failed to remove item')
    }
  }

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    try {
      const result = await createCheckoutSession(memberId)
      if (result.url) {
        window.location.href = result.url
      }
    } catch (error) {
      toast.error('Failed to create checkout session')
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  if (!cart || cart.items?.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <CartIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>Your cart is empty</Typography>
        <Typography color="textSecondary" mb={4}>
          Browse our products and add items to your cart
        </Typography>
        <Button variant="contained" href="/apps/products">
          Continue Shopping
        </Button>
      </Box>
    )
  }

  const subtotal = cart.items.reduce((sum: number, item: any) => 
    sum + Number(item.unitPrice) * item.quantity, 0
  )
  const tax = subtotal * 0.18
  const total = subtotal + tax

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardHeader title="Shopping Cart" subheader={`${cart.items.length} items`} />
          <CardContent>
            {cart.items.map((item: any, index: number) => (
              <Box key={item.id}>
                {index > 0 && <Divider sx={{ my: 2 }} />}
                <Box display="flex" gap={3} alignItems="center">
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.product?.imageUrl ? (
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Typography color="textSecondary">No Image</Typography>
                    )}
                  </Box>
                  <Box flex={1}>
                    <Typography variant="h6">{item.product?.name}</Typography>
                    <Typography color="textSecondary">
                      {item.product?.category}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    >
                      <Remove />
                    </IconButton>
                    <Typography sx={{ minWidth: 40, textAlign: 'center' }}>
                      {item.quantity}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      <Add />
                    </IconButton>
                  </Box>
                  <Typography variant="h6" sx={{ minWidth: 100, textAlign: 'right' }}>
                    ₹{Number(item.unitPrice) * item.quantity}
                  </Typography>
                  <IconButton color="error" onClick={() => handleRemoveItem(item.id)}>
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardHeader title="Order Summary" />
          <CardContent>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography>Subtotal</Typography>
              <Typography>₹{subtotal.toFixed(2)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography>GST (18%)</Typography>
              <Typography>₹{tax.toFixed(2)}</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" justifyContent="space-between" mb={3}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6">₹{total.toFixed(2)}</Typography>
            </Box>
            <Button 
              variant="contained" 
              fullWidth 
              size="large"
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? <CircularProgress size={24} /> : 'Proceed to Checkout'}
            </Button>
            <Button 
              variant="outlined" 
              fullWidth 
              sx={{ mt: 2 }}
              href="/apps/products"
            >
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
