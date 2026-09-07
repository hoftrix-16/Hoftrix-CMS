import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import TextFormInput from '@/components/form/TextFormInput'
import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

const newPasswordSchema = yup.object({
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Please enter a new password'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
})

type NewPasswordFields = yup.InferType<typeof newPasswordSchema>

const NewPasswordForm = () => {
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showNotification } = useNotificationContext()
  const token = searchParams.get('token')

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(newPasswordSchema),
  })

  const onSubmit = handleSubmit(async (values: NewPasswordFields) => {
    if (!token) {
      showNotification({ message: 'Invalid reset link. Request a new one from the sign-in page.', variant: 'danger' })
      return
    }

    setLoading(true)
    try {
      const res = await httpClient.post('/auth/reset-password', {
        token,
        password: values.password,
      })
      showNotification({ message: res.data.message || 'Password updated successfully.', variant: 'success' })
      navigate('/auth/sign-in')
    } catch (e: any) {
      showNotification({
        message: e.response?.data?.message || 'Failed to reset password',
        variant: 'danger',
      })
    } finally {
      setLoading(false)
    }
  })

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-danger mb-3">This reset link is invalid or missing a token.</p>
        <Link to="/auth/reset-pass" className="fw-semibold">
          Request a new reset link
        </Link>
      </div>
    )
  }

  return (
    <form className="authentication-form" onSubmit={onSubmit}>
      <TextFormInput
        control={control}
        name="password"
        type="password"
        containerClassName="mb-3"
        label="New Password"
        id="new-password"
        placeholder="Enter new password"
      />
      <TextFormInput
        control={control}
        name="confirmPassword"
        type="password"
        containerClassName="mb-3"
        label="Confirm Password"
        id="confirm-password"
        placeholder="Confirm new password"
      />
      <div className="mb-1 text-center d-grid">
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Set New Password'}
        </Button>
      </div>
    </form>
  )
}

export default NewPasswordForm
