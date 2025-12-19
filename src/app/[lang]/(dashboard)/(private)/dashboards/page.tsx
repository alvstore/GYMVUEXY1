import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'

type Props = {
  params: Promise<{ lang: string }>
}

export default async function DashboardRouter({ params }: Props) {
  const { lang } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect(`/${lang}/login`)
  }

  const roles = (session.user as any).roles || []

  if (roles.includes('member')) {
    redirect(`/${lang}/member-portal`)
  }

  if (roles.includes('staff') || roles.includes('trainer')) {
    redirect(`/${lang}/dashboards/staff`)
  }

  redirect(`/${lang}/dashboards/manager`)
}
