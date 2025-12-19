// Component Imports
import Payment from '@views/front-pages/Payment'

// Data Imports
import { getPricingData } // TEMP: Disabled - fake data removed // from '@/app/server/actions'

const PaymentPage = async () => {
  // Vars
  const data = // await getPricingData()

  return <Payment data={data} />
}

export default PaymentPage
