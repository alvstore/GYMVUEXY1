// Component Imports
import OrderList from '@views/apps/ecommerce/orders/list'

// Data Imports
import { getOrders } from '@/app/actions/commerce'

const OrdersListPage = async () => {
  const result = await getOrders({ page: 1, limit: 100 })

  return <OrderList orderData={result.orders} />
}

export default OrdersListPage
