import { Link } from 'react-router-dom'
import * as yup from 'yup'
import { Button, Spinner } from 'react-bootstrap'

import PasswordFormInput from '@/components/form/PasswordFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import useSignIn from './useSignIn'

export const loginSchema = yup.object({
  email: yup.string().email('Please enter a valid email').required('please enter your email'),
  password: yup.string().required('Please enter your password'),
})

const LoginForm = () => {
  const { loading, login, control } = useSignIn()

  return (
    <form onSubmit={login} className="authentication-form">
      <TextFormInput control={control} name="email" containerClassName="mb-3" label="Email" id="email-id" placeholder="Enter your email" />

      <PasswordFormInput
        control={control}
        name="password"
        containerClassName="mb-3"
        placeholder="Enter your password"
        id="password-id"
        label={
          <>
            <Link to="/auth/reset-pass" className="float-end ms-1 fw-semibold text-decoration-none" style={{ color: '#FF4D00', fontSize: '0.8125rem' }}>
              Reset password
            </Link>
            <label className="form-label" htmlFor="example-password">
              Password
            </label>
          </>
        }
      />

      <div className="mb-3">
        <div className="form-check">
          <input type="checkbox" className="form-check-input" id="checkbox-signin" />
          <label className="form-check-label" htmlFor="checkbox-signin">
            Remember me
          </label>
        </div>
      </div>
      <div className="mb-1 text-center d-grid">
        <Button variant="primary" type="submit" disabled={loading} className="d-flex align-items-center justify-content-center gap-2">
          {loading && <Spinner animation="border" size="sm" role="status" aria-hidden="true" />}
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </div>
    </form>
  )
}

export default LoginForm
