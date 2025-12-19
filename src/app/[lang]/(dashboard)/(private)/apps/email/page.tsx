// Component Imports
import EmailWrapper from '@views/apps/email'
import { requirePermission } from '@/libs/serverAuth'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Email',
  description: 'Send and receive emails',
}

const EmailPage = async () => {
  // Require permission to access email
  await requirePermission('communications.view')

  return <EmailWrapper folder='inbox' />
}

export default EmailPage
