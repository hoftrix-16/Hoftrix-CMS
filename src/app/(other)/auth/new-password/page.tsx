import { Link } from 'react-router-dom'

import PageMetaData from '@/components/PageTitle'
import AuthShell from '@/components/AuthShell'
import NewPasswordForm from './components/NewPasswordForm'

const NewPassword = () => {
  return (
    <>
      <PageMetaData title="Set New Password" />
      <AuthShell title="Set New Password" subtitle="Choose a strong password for your account.">
        <NewPasswordForm />
        <p className="text-center text-muted small mt-4 mb-0">
          Back to{' '}
          <Link to="/auth/sign-in" className="fw-semibold text-decoration-none" style={{ color: '#FF4D00' }}>
            Sign In
          </Link>
        </p>
      </AuthShell>
    </>
  )
}

export default NewPassword
