// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import ProductListTable from '@views/apps/ecommerce/products/list/ProductListTable'
import ProductCard from '@views/apps/ecommerce/products/list/ProductCard'

// Data Imports
import { getProducts } from '@/app/actions/commerce'

const eCommerceProductsList = async () => {
  const result = await getProducts({ page: 1, limit: 100 })

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <ProductCard />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <ProductListTable productData={result.products} />
      </Grid>
    </Grid>
  )
}

export default eCommerceProductsList
