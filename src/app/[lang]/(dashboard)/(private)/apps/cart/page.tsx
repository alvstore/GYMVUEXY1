import type { Metadata } from 'next'
import { requirePermission, getAuthContext } from '@/libs/serverAuth'
import { prisma } from '@/libs/prisma'
import ShoppingCart from '@/views/apps/ecommerce/ShoppingCart'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'View and manage your shopping cart',
}

export default async function CartPage() {
  const context = await requirePermission('self.update')
  
  const member = await prisma.member.findFirst({
    where: { 
      tenantId: context.tenantId!,
      email: context.email,
    },
  })

  if (!member) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h5" color="error">
          Member account not found
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box mb={6}>
        <Typography variant="h4" gutterBottom>Shopping Cart</Typography>
        <Typography color="textSecondary">
          Review your items and proceed to checkout
        </Typography>
      </Box>
      <ShoppingCart memberId={member.id} />
    </Box>
  )
}
