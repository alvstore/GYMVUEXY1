import CouponManagement from '@/views/apps/coupons/CouponManagement'
import { getCoupons } from '@/app/actions/memberships/coupons'

const CouponsPage = async () => {
  const coupons = await getCoupons()

  return <CouponManagement coupons={coupons} />
}

export default CouponsPage
