import { useState } from 'react'
import TextFormInput from '@/components/form/TextFormInput'
import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

const resetPasswordSchema = yup.object({
  email: yup.string().email('Please enter a valid email').required('Please enter your email'),
})

type ResetPasswordFields = yup.InferType<typeof resetPasswordSchema>

const ResetPassForm = () => {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { showNotification } = useNotificationContext()

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(resetPasswordSchema),
  })

  const onSubmit = handleSubmit(async (values: ResetPasswordFields) => {
    setLoading(true)
    try {
      const res = await httpClient.post('/auth/forgot-password', { email: values.email })
      setSent(true)
      showNotification({
        message: res.data.message || 'Check your email for reset instructions.',
        variant: 'success',
      })
    } catch (e: any) {
      showNotification({
        message: e.response?.data?.message || 'Failed to send reset email',
        variant: 'danger',
      })
    } finally {
      setLoading(false)
    }
  })

  if (sent) {
    return (
      <div className="text-center text-muted">
        <p className="mb-0">If an account exists with that email, reset instructions have been sent.</p>
        <p className="small mt-2 mb-0">Check your inbox (and spam folder). In development, the reset link is printed in the backend console if SMTP is not configured.</p>
      </div>
    )
  }

  return (
    <form className="authentication-form" onSubmit={onSubmit}>
      <TextFormInput
        control={control}
        name="email"
        containerClassName="mb-3"
        label="Email"
        id="email-id"
        placeholder="Enter your email"
      />
      <div className="mb-1 text-center d-grid">
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Reset Password'}
        </Button>
      </div>
    </form>
  )
}

export default ResetPassForm
