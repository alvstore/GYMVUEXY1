'use client'

import { useState, useEffect } from 'react'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Badge from '@mui/material/Badge'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import { toast } from 'react-toastify'
import { getPublicProducts, createMemberOrder } from '@/app/actions/memberCheckout'

type Product = {
  id: string
  name: string
  description: string | null
  category: string
  sellingPrice: number
  mrp: number
  stockQuantity: number
  imageUrl?: string | null
  taxRate: number
}

type CartItem = {
  productId: string
  name: string
  price: number
  mrp: number
  quantity: number
  imageUrl?: string | null
  taxRate: number
}

const MemberStore = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [cartOpen, setCartOpen] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const result = await getPublicProducts({ page: 1, limit: 100 })
      const formattedProducts = result.products.map(p => ({
        ...p,
        sellingPrice: Number(p.sellingPrice),
        mrp: Number(p.mrp),
        taxRate: Number(p.taxRate),
      }))
      setProducts(formattedProducts as any)
    } catch (error) {
      console.error('Failed to load products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))]

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                         p.description?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'ALL' || p.category === category
    return matchesSearch && matchesCategory && p.stockQuantity > 0
  })

  const addToCart = (product: Product) => {
    if (product.stockQuantity < 1) {
      toast.error('Product out of stock')
      return
    }

    const existing = cart.find(item => item.productId === product.id)
    if (existing) {
      if (existing.quantity >= product.stockQuantity) {
        toast.error('Not enough stock available')
        return
      }
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ))
      toast.success('Added to cart')
    } else {
      setCart([...cart, { 
        productId: product.id,
        name: product.name, 
        price: Number(product.sellingPrice),
        mrp: Number(product.mrp),
        taxRate: Number(product.taxRate),
        imageUrl: product.imageUrl,
        quantity: 1 
      }])
      toast.success('Added to cart')
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId)
    
    if (quantity === 0) {
      removeFromCart(productId)
      return
    }

    if (product && quantity > product.stockQuantity) {
      toast.error('Not enough stock available')
      return
    }

    setCart(cart.map(item => 
      item.productId === productId 
        ? { ...item, quantity } 
        : item
    ))
  }

  const calculateTotals = () => {
    let subtotal = 0
    let taxAmount = 0
    let savings = 0

    cart.forEach(item => {
      const itemSubtotal = item.price * item.quantity
      const itemTax = (itemSubtotal * item.taxRate) / 100
      const itemSavings = (item.mrp - item.price) * item.quantity
      
      subtotal += itemSubtotal
      taxAmount += itemTax
      savings += itemSavings
    })

    const total = subtotal + taxAmount

    return { subtotal, taxAmount, total, savings }
  }

  const proceedToCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    try {
      setProcessing(true)

      const result = await createMemberOrder({
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        notes: 'Member store purchase',
      })

      if (result.success && result.invoice) {
        toast.success('Order placed successfully! Redirecting to payment...')
        setCart([])
        
        // Redirect to invoice preview/payment page
        window.location.href = `/apps/invoice/preview/${result.invoice.id}`
      }
    } catch (error: any) {
      console.error('Order failed:', error)
      toast.error(error.message || 'Failed to place order')
    } finally {
      setProcessing(false)
    }
  }

  const { subtotal, taxAmount, total, savings } = calculateTotals()
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <>
      <div className='flex justify-between items-center mbe-6'>
        <div>
          <Typography variant='h4' className='mbe-1'>
            Member Store
          </Typography>
          <Typography variant='body2' className='text-textSecondary'>
            Browse and shop gym products
          </Typography>
        </div>
        <IconButton
          color='primary'
          onClick={() => setCartOpen(true)}
        >
          <Badge badgeContent={cartItemCount} color='error'>
            <i className='tabler-shopping-cart text-2xl' />
          </Badge>
        </IconButton>
      </div>

      <Card className='mbe-6'>
        <CardContent>
          <Grid container spacing={3} alignItems='center'>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                placeholder='Search products...'
                value={search}
                onChange={e => setSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <i className='tabler-search' style={{ marginRight: 8 }} />
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  label='Category'
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                fullWidth
                variant='outlined'
                startIcon={<i className='tabler-refresh' />}
                onClick={loadProducts}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <div className='flex justify-center items-center py-12'>
          <CircularProgress />
        </div>
      ) : (
        <Grid container spacing={4}>
          {filteredProducts.map(product => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
              <Card className='h-full flex flex-col'>
                {product.imageUrl && (
                  <CardMedia
                    component='img'
                    height='200'
                    image={product.imageUrl}
                    alt={product.name}
                    className='object-cover'
                  />
                )}
                <CardContent className='flex-1 flex flex-col'>
                  <Chip label={product.category} size='small' className='mbe-2 w-fit' />
                  <Typography variant='h6' className='mbe-1'>
                    {product.name}
                  </Typography>
                  {product.description && (
                    <Typography variant='body2' className='text-textSecondary mbe-2 line-clamp-2'>
                      {product.description}
                    </Typography>
                  )}
                  <div className='mt-auto'>
                    <div className='flex items-baseline gap-2 mbe-2'>
                      <Typography variant='h6' color='primary'>
                        ₹{product.sellingPrice.toLocaleString()}
                      </Typography>
                      {product.mrp > product.sellingPrice && (
                        <>
                          <Typography variant='body2' className='line-through text-textSecondary'>
                            ₹{product.mrp.toLocaleString()}
                          </Typography>
                          <Chip
                            label={`${Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)}% OFF`}
                            size='small'
                            color='success'
                          />
                        </>
                      )}
                    </div>
                    <Typography variant='caption' className='block mbe-2 text-textSecondary'>
                      Stock: {product.stockQuantity} available
                    </Typography>
                    <Button
                      fullWidth
                      variant='contained'
                      onClick={() => addToCart(product)}
                      disabled={product.stockQuantity < 1}
                      startIcon={<i className='tabler-shopping-cart-plus' />}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {filteredProducts.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent className='text-center py-12'>
                  <i className='tabler-package text-6xl text-textSecondary' />
                  <Typography className='text-textSecondary mbs-2'>
                    No products found
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Shopping Cart Drawer */}
      <Drawer
        anchor='right'
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 } }
        }}
      >
        <div className='p-6 h-full flex flex-col'>
          <div className='flex justify-between items-center mbe-4'>
            <Typography variant='h5'>Shopping Cart</Typography>
            <IconButton onClick={() => setCartOpen(false)}>
              <i className='tabler-x' />
            </IconButton>
          </div>

          <Divider className='mbe-4' />

          {cart.length === 0 ? (
            <div className='flex-1 flex flex-col justify-center items-center'>
              <i className='tabler-shopping-cart-off text-6xl text-textSecondary' />
              <Typography className='text-textSecondary mbs-2'>
                Your cart is empty
              </Typography>
            </div>
          ) : (
            <>
              <div className='flex-1 overflow-y-auto mbe-4'>
                {cart.map(item => (
                  <div key={item.productId} className='flex gap-3 mbe-4 pb-4 border-b'>
                    {item.imageUrl && (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className='w-20 h-20 object-cover rounded'
                      />
                    )}
                    <div className='flex-1'>
                      <Typography className='font-medium'>{item.name}</Typography>
                      <div className='flex items-baseline gap-2 mbe-1'>
                        <Typography variant='body2' color='primary'>
                          ₹{item.price.toLocaleString()}
                        </Typography>
                        {item.mrp > item.price && (
                          <Typography variant='caption' className='line-through text-textSecondary'>
                            ₹{item.mrp}
                          </Typography>
                        )}
                      </div>
                      <div className='flex items-center gap-2'>
                        <IconButton 
                          size='small' 
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <i className='tabler-minus' />
                        </IconButton>
                        <Typography className='min-w-8 text-center'>{item.quantity}</Typography>
                        <IconButton 
                          size='small' 
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <i className='tabler-plus' />
                        </IconButton>
                        <IconButton 
                          size='small' 
                          color='error' 
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <i className='tabler-trash' />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Divider className='mbe-3' />

              <div className='space-y-2 mbe-4'>
                <div className='flex justify-between'>
                  <Typography>Subtotal:</Typography>
                  <Typography>₹{subtotal.toLocaleString()}</Typography>
                </div>
                <div className='flex justify-between'>
                  <Typography>Tax:</Typography>
                  <Typography>₹{taxAmount.toFixed(2)}</Typography>
                </div>
                {savings > 0 && (
                  <div className='flex justify-between text-success-main'>
                    <Typography color='success.main'>You Save:</Typography>
                    <Typography color='success.main'>₹{savings.toLocaleString()}</Typography>
                  </div>
                )}
                <Divider />
                <div className='flex justify-between items-center'>
                  <Typography variant='h6'>Total:</Typography>
                  <Typography variant='h6' color='primary'>
                    ₹{total.toFixed(2)}
                  </Typography>
                </div>
              </div>

              <Button
                fullWidth
                variant='contained'
                size='large'
                onClick={proceedToCheckout}
                disabled={processing}
                startIcon={processing ? <CircularProgress size={20} /> : <i className='tabler-check' />}
              >
                {processing ? 'Processing...' : 'Proceed to Checkout'}
              </Button>

              <Button
                fullWidth
                variant='outlined'
                size='small'
                className='mbs-2'
                onClick={() => setCart([])}
                disabled={processing}
              >
                Clear Cart
              </Button>
            </>
          )}
        </div>
      </Drawer>
    </>
  )
}

export default MemberStore
