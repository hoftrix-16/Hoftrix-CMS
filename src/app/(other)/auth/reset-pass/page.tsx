import { Link } from 'react-router-dom'

import PageMetaData from '@/components/PageTitle'
import AuthShell from '@/components/AuthShell'
import ResetPassForm from './components/ResetPassForm'

const ResetPassword = () => {
  return (
    <>
      <PageMetaData title="Reset Password" />
      <AuthShell title="Reset Password" subtitle="We'll send reset instructions to your email.">
        <ResetPassForm />
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

export default ResetPassword
