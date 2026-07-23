import { Link } from 'react-router-dom'

import PageMetaData from '@/components/PageTitle'
import AuthShell from '@/components/AuthShell'
import LoginForm from './LoginForm'

const SignIn = () => {
  return (
    <>
      <PageMetaData title="Sign In" />
      <AuthShell
        title="Sign In"
        subtitle="Enter your email and password to continue."
      >
        <LoginForm />
        <p className="text-center text-muted small mt-4 mb-0">
          <Link to="/auth/reset-pass" className="text-decoration-none fw-semibold" style={{ color: '#FF4D00' }}>
            Forgot your password?
          </Link>
        </p>
      </AuthShell>
    </>
  )
}

export default SignIn
