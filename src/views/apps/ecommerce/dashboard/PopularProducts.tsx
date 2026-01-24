'use client'

import { useEffect, useState } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import Box from '@mui/material/Box'

import OptionMenu from '@core/components/option-menu'
import { getPopularProducts } from '@/app/actions/dashboards/ecommerce'

type ProductData = {
  id: string
  name: string
  sku: string
  imageUrl?: string | null
  price: number
  totalSold: number
  totalRevenue: number
}

const PopularProducts = () => {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<ProductData[]>([])
  const [sortOrder, setSortOrder] = useState<'quantity' | 'revenue'>('quantity')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await getPopularProducts(6)
      setProducts(data)
    } catch (err) {
      console.error('Failed to load popular products:', err)
    } finally {
      setLoading(false)
    }
  }

  const sortedProducts = [...products].sort((a, b) => {
    if (sortOrder === 'revenue') return b.totalRevenue - a.totalRevenue
    return b.totalSold - a.totalSold
  })

  const totalSold = products.reduce((sum, p) => sum + p.totalSold, 0)

  const handleSortChange = (option: string) => {
    if (option === 'By Revenue') setSortOrder('revenue')
    else setSortOrder('quantity')
  }

  return (
    <Card>
      <CardHeader
        title='Popular Products'
        subheader={`Total ${totalSold.toLocaleString()} sold`}
        action={
          <OptionMenu 
            options={['By Quantity', 'By Revenue']}
            onOptionClick={(option) => handleSortChange(option as string)}
          />
        }
      />
      <CardContent className='flex flex-col gap-[1.638rem]'>
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Box key={index} className='flex items-center gap-4'>
              <Skeleton variant="rectangular" width={46} height={46} />
              <Box className='flex-1'>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </Box>
              <Skeleton variant="text" width={60} />
            </Box>
          ))
        ) : products.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            No product sales data available
          </Typography>
        ) : (
          sortedProducts.map((item, index) => (
            <div key={item.id || index} className='flex items-center gap-4'>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} width={46} style={{ objectFit: 'cover', borderRadius: 4 }} />
              ) : (
                <Box 
                  sx={{ 
                    width: 46, 
                    height: 46, 
                    bgcolor: 'action.hover', 
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <i className="tabler-package" style={{ fontSize: 20 }} />
                </Box>
              )}
              <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
                <div className='flex flex-col'>
                  <Typography className='font-medium' color='text.primary'>
                    {item.name}
                  </Typography>
                  <Typography variant='body2'>
                    {item.totalSold} sold | SKU: {item.sku || 'N/A'}
                  </Typography>
                </div>
                <Typography>${item.price.toFixed(2)}</Typography>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export default PopularProducts
